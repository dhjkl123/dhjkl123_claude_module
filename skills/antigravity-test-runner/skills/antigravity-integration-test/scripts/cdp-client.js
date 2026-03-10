/**
 * 공유 CDP(Chrome DevTools Protocol) 클라이언트 라이브러리
 * 안티그래비티 IDE와의 WebSocket 통신을 위한 공통 로직
 */
var http = require('http');
var WebSocket = require('ws');

var DEFAULT_PORT = 9222;
var TARGET_FILTER = function(t) {
  return t.title && t.title.includes('Antigravity') && t.type === 'page';
};

/**
 * CDP 클라이언트 생성
 * @param {object} opts - { port: number }
 * @returns {object} client 인스턴스
 */
function createClient(opts) {
  opts = opts || {};
  var port = opts.port || DEFAULT_PORT;
  var ws = null;
  var msgId = 0;
  var target = null;

  /**
   * CDP 타겟 목록 조회
   */
  function getTargets() {
    return new Promise(function(resolve, reject) {
      http.get('http://127.0.0.1:' + port + '/json', function(res) {
        var d = '';
        res.on('data', function(c) { d += c; });
        res.on('end', function() {
          try { resolve(JSON.parse(d)); }
          catch (e) { reject(new Error('CDP 응답 파싱 실패: ' + d.substring(0, 100))); }
        });
      }).on('error', function(e) {
        reject(new Error('CDP 연결 실패 (포트 ' + port + '): ' + e.message));
      });
    });
  }

  /**
   * 안티그래비티 타겟에 WebSocket 연결
   * @returns {Promise<object>} 타겟 정보
   */
  function connect() {
    return getTargets().then(function(targets) {
      var m = targets.find(TARGET_FILTER);
      if (!m) {
        throw new Error('안티그래비티 타겟을 찾을 수 없습니다. Antigravity IDE가 --remote-debugging-port=' + port + ' 옵션으로 실행 중인지 확인하세요.');
      }
      target = m;
      ws = new WebSocket(m.webSocketDebuggerUrl);
      return new Promise(function(resolve, reject) {
        ws.on('open', function() { resolve(m); });
        ws.on('error', function(e) {
          reject(new Error('WebSocket 연결 실패: ' + e.message));
        });
      });
    });
  }

  /**
   * CDP 명령 전송 (범용 JSON-RPC)
   * @param {string} method - CDP 메서드 (예: 'Runtime.evaluate')
   * @param {object} params - 파라미터
   * @returns {Promise<object>} 응답 메시지
   */
  function sendCDP(method, params) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error('WebSocket이 연결되지 않았습니다. connect()를 먼저 호출하세요.'));
    }
    var id = ++msgId;
    return new Promise(function(resolve) {
      var handler = function(raw) {
        var msg = JSON.parse(raw.toString());
        if (msg.id === id) {
          ws.removeListener('message', handler);
          resolve(msg);
        }
      };
      ws.on('message', handler);
      ws.send(JSON.stringify({ id: id, method: method, params: params || {} }));
    });
  }

  /**
   * JavaScript 표현식 평가 (Runtime.evaluate 래퍼)
   * @param {string} expression - 평가할 JS 표현식
   * @returns {Promise<*>} 평가 결과 값
   */
  function evaluate(expression) {
    return sendCDP('Runtime.evaluate', {
      expression: expression,
      returnByValue: true
    }).then(function(msg) {
      if (msg.result && msg.result.result) {
        if (msg.result.result.type === 'undefined') return undefined;
        return msg.result.result.value;
      }
      if (msg.result && msg.result.exceptionDetails) {
        throw new Error('JS 평가 오류: ' + JSON.stringify(msg.result.exceptionDetails));
      }
      return null;
    });
  }

  /**
   * WebSocket 연결 종료
   */
  function close() {
    if (ws) {
      ws.close();
      ws = null;
    }
  }

  /**
   * 현재 타겟 정보 반환
   */
  function getTarget() {
    return target;
  }

  /**
   * 연결 상태 확인
   */
  function isConnected() {
    return ws && ws.readyState === WebSocket.OPEN;
  }

  return {
    getTargets: getTargets,
    connect: connect,
    sendCDP: sendCDP,
    evaluate: evaluate,
    close: close,
    getTarget: getTarget,
    isConnected: isConnected
  };
}

/**
 * 1회성 evaluate (연결 → 평가 → 종료)
 * 폴링 등 반복 호출에서 사용
 */
function evaluateOnce(expression, opts) {
  opts = opts || {};
  var port = opts.port || DEFAULT_PORT;
  var timeout = opts.timeout || 10000;

  return new Promise(function(resolve, reject) {
    http.get('http://127.0.0.1:' + port + '/json', function(res) {
      var d = '';
      res.on('data', function(c) { d += c; });
      res.on('end', function() {
        var targets;
        try { targets = JSON.parse(d); }
        catch (e) { reject(new Error('CDP 응답 파싱 실패')); return; }

        var m = targets.find(TARGET_FILTER);
        if (!m) { reject(new Error('안티그래비티 타겟 없음')); return; }

        var ws = new WebSocket(m.webSocketDebuggerUrl);
        var timer = setTimeout(function() { ws.close(); resolve(null); }, timeout);

        ws.on('open', function() {
          ws.send(JSON.stringify({
            id: 1,
            method: 'Runtime.evaluate',
            params: { expression: expression, returnByValue: true }
          }));
        });
        ws.on('message', function(raw) {
          var msg = JSON.parse(raw.toString());
          if (msg.id === 1) {
            clearTimeout(timer);
            var val = msg.result && msg.result.result && msg.result.result.value;
            resolve(val);
            ws.close();
          }
        });
        ws.on('error', function(e) {
          clearTimeout(timer);
          reject(e);
        });
      });
    }).on('error', function(e) {
      reject(new Error('CDP 연결 실패 (포트 ' + port + '): ' + e.message));
    });
  });
}

module.exports = {
  createClient: createClient,
  evaluateOnce: evaluateOnce,
  DEFAULT_PORT: DEFAULT_PORT
};
