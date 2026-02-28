import { safe } from './safe';

describe('safe', () => {
  class CustomError extends Error {
    constructor(message?: string) {
      super(message);
      this.name = 'CustomError';
    }
  }

  class AnotherError extends Error {
    constructor(message?: string) {
      super(message);
      this.name = 'AnotherError';
    }
  }

  describe('with synchronous functions', () => {
    it('should handle successful case', () => {
      const fn = (x: number) => x * 2;
      const safeFn = safe(fn);
      const [error, data] = safeFn(2);

      expect(error).toBeNull();
      expect(data).toBe(4);
    });

    it('should handle error case', () => {
      const fn = () => {
        throw new Error('test error');
      };
      const safeFn = safe(fn);
      const [error, data] = safeFn();
      expect(error).toBeInstanceOf(Error);
      expect(data).toBeNull();
    });

    it('should handle specific error types', () => {
      const fn = () => {
        throw new CustomError('custom error');
      };
      const safeFn = safe(fn, [CustomError] as const);
      const [error, data] = safeFn();

      expect(error).toBeInstanceOf(CustomError);
      expect(data).toBeNull();
    });
  });

  describe('with asynchronous functions', () => {
    it('should handle successful async case', async () => {
      const fn = async (x: number) => x * 2;
      const safeFn = safe(fn);
      const [error, result] = await safeFn(2);

      expect(error).toBeNull();
      expect(result).toBe(4);
    });

    it('should handle async error case', async () => {
      const fn = async () => {
        throw new Error('async error');
      };
      const safeFn = safe(fn);
      const [error, result] = await safeFn();

      expect(error).toBeInstanceOf(Error);
      expect(result).toBeNull();
    });

    it('should handle error transformation', async () => {
      const fn = async () => {
        throw new Error('original error');
      };
      const transformer = (error: Error) => new CustomError(error.message);
      const safeFn = safe(fn, [], transformer);
      const [error, result] = await safeFn();

      expect(error).toBeInstanceOf(CustomError);
      expect(result).toBeNull();
    });

    it('should rethrow unspecified errors', async () => {
      const fn = async () => {
        throw new AnotherError('another error');
      };
      const safeFn = safe(fn, [CustomError] as const);

      await expect(safeFn()).rejects.toThrow('another error');
    });
  });
});

// class CustomError extends Error {
//   public messages: string[];

//   constructor(message?: string) {
//     super(message);
//     this.name = 'CustomError';
//     this.messages = ['Custom error occurred'];

//     // Maintains proper stack trace for where our error was thrown (only available on V8)
//     if (Error.captureStackTrace) {
//       Error.captureStackTrace(this, CustomError);
//     }
//   }
// }

// class CustomError2 extends Error {
//   public messages: string[];

//   constructor(message?: string) {
//     super(message);
//     this.name = 'CustomError';
//     this.messages = ['Custom error occurred'];

//     // Maintains proper stack trace for where our error was thrown (only available on V8)
//     if (Error.captureStackTrace) {
//       Error.captureStackTrace(this, CustomError);
//     }
//   }
// }

// const testFn = (a: string) => {
//   if (!a) {
//     throw new CustomError('empty string');
//   }
//   return a;
// };

// async () => {
//   const safeTest = safe(testFn, [CustomError] as const);

//   const safeTest2 = safe(testFn, [CustomError, CustomError2]);

//   const [error, data] = safeTest('sd');

//   const [error2, data2] = safeTest2('sd');

//   console.log(data, error);
// };

// // safe()
// const _a = safe(async _ss: string) => '');
// const _b = safe(() => new Promise(() => {}));

// export const fetchSecurity = safe(async ({ signal }: { signal?: AbortController['signal'] } = {}) => {
//   try {
//     return (await usersApi.get('security-info', { signal }).json(securityApiSchema)) as Promise<1>;
//   } catch (error) {
//     if (error instanceof HTTPError) {
//       console.error(`Error: ${error.response.status}`);
//     }
//     throw error;
//   }
// });

// export const generateMfaTotpRecoveryCodes = async (): Promise<{ recoveryCodes: string[] }> => {
//   try {
//     return await usersApi.post('mfa/$regenerate-recovery-codes').json();
//   } catch (error: any) {
//     // Handle different types of errors

//     if (error instanceof HTTPError) {
//       // KyError contains the response object
//       const { response } = error;
//       const { status } = response;
//       // Handle specific HTTP status codes
//       if (status === 400) {
//         // Assuming the response body contains JSON with error details
//         const errorData = await response.json();
//         return Promise.reject({ errors: [...(errorData.errors ?? ['Regenerate recovery codes was failed.'])] });
//       }

//       if (status === 500) {
//         return Promise.reject({ errors: ['Internal Server Error: Please try again later.'] });
//       }
//     }
//     return Promise.reject({ errors: ['Internal Error: Please try again later.'] });
//   }
// };
