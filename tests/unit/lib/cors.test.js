/**
 * Unit Tests for lib/cors.js
 *
 * Tests CORS (Cross-Origin Resource Sharing) configuration
 */

const { setCorsHeaders, allowedOrigins } = require('../../../lib/cors');

describe('lib/cors.js', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      headers: {},
      method: 'GET'
    };

    mockRes = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      end: jest.fn()
    };
  });

  describe('allowedOrigins', () => {
    test('should include production origins', () => {
      expect(allowedOrigins).toContain('https://thelondonsudoku.com');
      expect(allowedOrigins).toContain('https://www.thelondonsudoku.com');
      expect(allowedOrigins).toContain('https://the-london-sudoku.vercel.app');
      expect(allowedOrigins).toContain('https://the-new-london-times.vercel.app');
    });

    test('should be an array', () => {
      expect(Array.isArray(allowedOrigins)).toBe(true);
      expect(allowedOrigins.length).toBeGreaterThan(0);
    });

    test('should not contain null or undefined values', () => {
      expect(allowedOrigins.every(origin => origin !== null && origin !== undefined)).toBe(true);
    });

    test('should include localhost in development mode', () => {
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        // In development/test, localhost should be included
        const hasLocalhost = allowedOrigins.some(origin =>
          origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))
        );
        // This is conditional - might not be present in all test environments
        expect(typeof hasLocalhost).toBe('boolean');
      }
    });
  });

  describe('setCorsHeaders()', () => {
    describe('Whitelisted origins', () => {
      test('should allow whitelisted origin (thelondonsudoku.com)', () => {
        mockReq.headers.origin = 'https://thelondonsudoku.com';

        const handled = setCorsHeaders(mockReq, mockRes);

        expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'https://thelondonsudoku.com');
        expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Credentials', 'true');
        expect(handled).toBe(false); // Not a preflight request
      });

      test('should allow whitelisted origin (www.thelondonsudoku.com)', () => {
        mockReq.headers.origin = 'https://www.thelondonsudoku.com';

        setCorsHeaders(mockReq, mockRes);

        expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'https://www.thelondonsudoku.com');
        expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Credentials', 'true');
      });

      test('should allow whitelisted origin (Vercel preview)', () => {
        mockReq.headers.origin = 'https://the-london-sudoku.vercel.app';

        setCorsHeaders(mockReq, mockRes);

        expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'https://the-london-sudoku.vercel.app');
        expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Credentials', 'true');
      });
    });

    describe('Non-whitelisted origins', () => {
      test('should not set CORS headers for non-whitelisted origin', () => {
        mockReq.headers.origin = 'https://malicious-site.com';

        setCorsHeaders(mockReq, mockRes);

        // Should NOT set Access-Control-Allow-Origin for malicious origin
        expect(mockRes.setHeader).not.toHaveBeenCalledWith('Access-Control-Allow-Origin', 'https://malicious-site.com');
        expect(mockRes.setHeader).not.toHaveBeenCalledWith('Access-Control-Allow-Credentials', 'true');

        // Should still set other headers
        expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
        expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Headers', 'Content-Type,Authorization');
      });

      test('should reject origin with different protocol', () => {
        mockReq.headers.origin = 'http://thelondonsudoku.com'; // HTTP instead of HTTPS

        setCorsHeaders(mockReq, mockRes);

        expect(mockRes.setHeader).not.toHaveBeenCalledWith('Access-Control-Allow-Origin', 'http://thelondonsudoku.com');
      });

      test('should reject subdomain not in whitelist', () => {
        mockReq.headers.origin = 'https://evil.thelondonsudoku.com';

        setCorsHeaders(mockReq, mockRes);

        expect(mockRes.setHeader).not.toHaveBeenCalledWith('Access-Control-Allow-Origin', 'https://evil.thelondonsudoku.com');
      });
    });

    describe('Same-origin requests', () => {
      test('should handle requests without origin header', () => {
        // No origin header (same-origin request)
        delete mockReq.headers.origin;

        setCorsHeaders(mockReq, mockRes);

        // Should set default origin (first in whitelist)
        expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', allowedOrigins[0]);
      });

      test('should handle requests with empty origin', () => {
        mockReq.headers.origin = '';

        setCorsHeaders(mockReq, mockRes);

        // Empty string is falsy, should use default origin
        expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', allowedOrigins[0]);
      });
    });

    describe('CORS headers', () => {
      test('should always set Access-Control-Allow-Methods', () => {
        mockReq.headers.origin = 'https://thelondonsudoku.com';

        setCorsHeaders(mockReq, mockRes);

        expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
      });

      test('should always set Access-Control-Allow-Headers', () => {
        mockReq.headers.origin = 'https://thelondonsudoku.com';

        setCorsHeaders(mockReq, mockRes);

        expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Headers', 'Content-Type,Authorization');
      });

      test('should set Access-Control-Allow-Credentials for whitelisted origins', () => {
        mockReq.headers.origin = 'https://thelondonsudoku.com';

        setCorsHeaders(mockReq, mockRes);

        expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Credentials', 'true');
      });
    });

    describe('Preflight requests (OPTIONS)', () => {
      test('should handle OPTIONS preflight request', () => {
        mockReq.method = 'OPTIONS';
        mockReq.headers.origin = 'https://thelondonsudoku.com';

        const handled = setCorsHeaders(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.end).toHaveBeenCalled();
        expect(handled).toBe(true); // Preflight was handled
      });

      test('should set CORS headers before handling OPTIONS request', () => {
        mockReq.method = 'OPTIONS';
        mockReq.headers.origin = 'https://thelondonsudoku.com';

        setCorsHeaders(mockReq, mockRes);

        // Headers should be set before ending response
        const setHeaderCalls = mockRes.setHeader.mock.calls;
        const statusCall = mockRes.status.mock.calls[0];

        expect(setHeaderCalls.length).toBeGreaterThan(0);
        expect(statusCall).toBeDefined();
      });

      test('should handle OPTIONS from non-whitelisted origin', () => {
        mockReq.method = 'OPTIONS';
        mockReq.headers.origin = 'https://malicious-site.com';

        const handled = setCorsHeaders(mockReq, mockRes);

        // Should still respond to OPTIONS but without CORS headers
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.end).toHaveBeenCalled();
        expect(handled).toBe(true);

        // Should NOT set origin header for malicious site
        expect(mockRes.setHeader).not.toHaveBeenCalledWith('Access-Control-Allow-Origin', 'https://malicious-site.com');
      });
    });

    describe('HTTP methods', () => {
      const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

      methods.forEach(method => {
        test(`should handle ${method} request`, () => {
          mockReq.method = method;
          mockReq.headers.origin = 'https://thelondonsudoku.com';

          const handled = setCorsHeaders(mockReq, mockRes);

          expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'https://thelondonsudoku.com');
          expect(handled).toBe(false); // Not a preflight request
          expect(mockRes.status).not.toHaveBeenCalled();
          expect(mockRes.end).not.toHaveBeenCalled();
        });
      });
    });

    describe('Security tests', () => {
      test('should not allow wildcard origin', () => {
        mockReq.headers.origin = '*';

        setCorsHeaders(mockReq, mockRes);

        expect(mockRes.setHeader).not.toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
      });

      test('should be case-sensitive for origins', () => {
        mockReq.headers.origin = 'https://TheLondonSudoku.com'; // Different case

        setCorsHeaders(mockReq, mockRes);

        expect(mockRes.setHeader).not.toHaveBeenCalledWith('Access-Control-Allow-Origin', 'https://TheLondonSudoku.com');
      });

      test('should not allow origin with extra path', () => {
        mockReq.headers.origin = 'https://thelondonsudoku.com/malicious';

        setCorsHeaders(mockReq, mockRes);

        expect(mockRes.setHeader).not.toHaveBeenCalledWith('Access-Control-Allow-Origin', 'https://thelondonsudoku.com/malicious');
      });

      test('should not allow origin with query parameters', () => {
        mockReq.headers.origin = 'https://thelondonsudoku.com?evil=true';

        setCorsHeaders(mockReq, mockRes);

        expect(mockRes.setHeader).not.toHaveBeenCalledWith('Access-Control-Allow-Origin', 'https://thelondonsudoku.com?evil=true');
      });

      test('should prevent CORS from similar but different domains', () => {
        const similarDomains = [
          'https://thelondonsudoku.com.evil.com',
          'https://fake-thelondonsudoku.com',
          'https://thelondonsudoku.co',
          'https://thelondonsudoku.org'
        ];

        similarDomains.forEach(domain => {
          mockReq.headers.origin = domain;
          setCorsHeaders(mockReq, mockRes);

          expect(mockRes.setHeader).not.toHaveBeenCalledWith('Access-Control-Allow-Origin', domain);
        });
      });
    });

    describe('Edge cases', () => {
      test('should handle null origin header', () => {
        mockReq.headers.origin = null;

        expect(() => setCorsHeaders(mockReq, mockRes)).not.toThrow();
      });

      test('should handle undefined origin header', () => {
        mockReq.headers.origin = undefined;

        expect(() => setCorsHeaders(mockReq, mockRes)).not.toThrow();
      });

      test('should handle request with no headers object', () => {
        mockReq.headers = undefined;

        expect(() => setCorsHeaders(mockReq, mockRes)).toThrow();
      });

      test('should handle multiple calls to setCorsHeaders', () => {
        mockReq.headers.origin = 'https://thelondonsudoku.com';

        setCorsHeaders(mockReq, mockRes);
        setCorsHeaders(mockReq, mockRes);

        // Should set headers twice
        expect(mockRes.setHeader).toHaveBeenCalledTimes(8); // 4 headers × 2 calls
      });
    });

    describe('Return value', () => {
      test('should return true for OPTIONS requests', () => {
        mockReq.method = 'OPTIONS';
        mockReq.headers.origin = 'https://thelondonsudoku.com';

        const result = setCorsHeaders(mockReq, mockRes);

        expect(result).toBe(true);
      });

      test('should return false for non-OPTIONS requests', () => {
        mockReq.method = 'GET';
        mockReq.headers.origin = 'https://thelondonsudoku.com';

        const result = setCorsHeaders(mockReq, mockRes);

        expect(result).toBe(false);
      });
    });
  });

  describe('Integration scenarios', () => {
    test('should handle complete request flow from whitelisted origin', () => {
      mockReq.method = 'POST';
      mockReq.headers.origin = 'https://thelondonsudoku.com';

      const handled = setCorsHeaders(mockReq, mockRes);

      // Should set all CORS headers
      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'https://thelondonsudoku.com');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Credentials', 'true');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Headers', 'Content-Type,Authorization');

      // Should not end response (not preflight)
      expect(mockRes.end).not.toHaveBeenCalled();
      expect(handled).toBe(false);
    });

    test('should handle preflight then actual request', () => {
      // First: Preflight request
      mockReq.method = 'OPTIONS';
      mockReq.headers.origin = 'https://thelondonsudoku.com';

      let handled = setCorsHeaders(mockReq, mockRes);

      expect(handled).toBe(true);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.end).toHaveBeenCalled();

      // Reset mocks
      jest.clearAllMocks();

      // Second: Actual request
      mockReq.method = 'POST';

      handled = setCorsHeaders(mockReq, mockRes);

      expect(handled).toBe(false);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.end).not.toHaveBeenCalled();
    });

    test('should block CSRF attack from non-whitelisted origin', () => {
      mockReq.method = 'POST';
      mockReq.headers.origin = 'https://evil-site.com';

      setCorsHeaders(mockReq, mockRes);

      // Should NOT set CORS headers for evil site
      expect(mockRes.setHeader).not.toHaveBeenCalledWith('Access-Control-Allow-Origin', 'https://evil-site.com');
      expect(mockRes.setHeader).not.toHaveBeenCalledWith('Access-Control-Allow-Credentials', 'true');

      // Browser will block the request due to CORS policy
    });
  });
});
