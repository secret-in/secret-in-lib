(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.Secretin = factory());
}(this, (function () { 'use strict';

var version = "1.0.0";

var asyncGenerator = function () {
  function AwaitValue(value) {
    this.value = value;
  }

  function AsyncGenerator(gen) {
    var front, back;

    function send(key, arg) {
      return new Promise(function (resolve, reject) {
        var request = {
          key: key,
          arg: arg,
          resolve: resolve,
          reject: reject,
          next: null
        };

        if (back) {
          back = back.next = request;
        } else {
          front = back = request;
          resume(key, arg);
        }
      });
    }

    function resume(key, arg) {
      try {
        var result = gen[key](arg);
        var value = result.value;

        if (value instanceof AwaitValue) {
          Promise.resolve(value.value).then(function (arg) {
            resume("next", arg);
          }, function (arg) {
            resume("throw", arg);
          });
        } else {
          settle(result.done ? "return" : "normal", result.value);
        }
      } catch (err) {
        settle("throw", err);
      }
    }

    function settle(type, value) {
      switch (type) {
        case "return":
          front.resolve({
            value: value,
            done: true
          });
          break;

        case "throw":
          front.reject(value);
          break;

        default:
          front.resolve({
            value: value,
            done: false
          });
          break;
      }

      front = front.next;

      if (front) {
        resume(front.key, front.arg);
      } else {
        back = null;
      }
    }

    this._invoke = send;

    if (typeof gen.return !== "function") {
      this.return = undefined;
    }
  }

  if (typeof Symbol === "function" && Symbol.asyncIterator) {
    AsyncGenerator.prototype[Symbol.asyncIterator] = function () {
      return this;
    };
  }

  AsyncGenerator.prototype.next = function (arg) {
    return this._invoke("next", arg);
  };

  AsyncGenerator.prototype.throw = function (arg) {
    return this._invoke("throw", arg);
  };

  AsyncGenerator.prototype.return = function (arg) {
    return this._invoke("return", arg);
  };

  return {
    wrap: function (fn) {
      return function () {
        return new AsyncGenerator(fn.apply(this, arguments));
      };
    },
    await: function (value) {
      return new AwaitValue(value);
    }
  };
}();

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};

var possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};

var toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

var symbols = '!@#$%^&*()+_=}{[]|:;"?.><,`~';
var vowels = 'aeiouy';
var consonants = 'bcdfghjklmnpqrstvwxz';
var numbers = '0123456789';

var similarChars = '[ilLI|`oO0';

var hasNumber = function hasNumber(str) {
  return str.match(/\d+/g) != null;
};
var hasMixedCase = function hasMixedCase(str) {
  return str.toUpperCase() !== str && str.toLowerCase() !== str;
};
var hasSymbol = function hasSymbol(str) {
  var regexString = '[' + escapeRegExp(symbols) + ']';
  var symbolRegex = new RegExp(regexString);
  return str.match(symbolRegex) != null;
};

var checkStrictRules = function checkStrictRules(str, rules) {
  return rules.numbers === hasNumber(str) && rules.mixedCase === hasMixedCase(str) && rules.symbols === hasSymbol(str);
};

var buildCharset = function buildCharset(options) {
  var charset = [];

  var letters = vowels + consonants;

  charset.push.apply(charset, [].concat(toConsumableArray(letters)));

  if (options.contentRules.mixedCase) {
    charset.push.apply(charset, [].concat(toConsumableArray(letters.toUpperCase())));
  }
  if (options.contentRules.numbers) {
    charset.push.apply(charset, [].concat(toConsumableArray(numbers)));
  }
  if (options.contentRules.symbols) {
    charset.push.apply(charset, [].concat(toConsumableArray(symbols)));
  }

  if (options.contentRules.similarChars === false) {
    charset.filter(function (character) {
      return similarChars.indexOf(character) >= 0;
    });
  }

  return charset;
};

var getRandomPassword = function getRandomPassword(options) {
  var password = '';

  if (options.readable) {
    var lastCharWasVocal = false; // TODO : rand

    for (var i = 0; i < options.length; i += 1) {
      var charset = lastCharWasVocal ? consonants : vowels;
      lastCharWasVocal = !lastCharWasVocal;
      var randomIndex = generateRandomNumber(charset.length);
      password += charset[randomIndex];
    }
  } else {
    var _charset = buildCharset(options);

    for (var _i = 0; _i < options.length; _i += 1) {
      var _randomIndex = generateRandomNumber(_charset.length);
      password += _charset[_randomIndex];
    }
  }

  return password;
};

var generatePassword = function generatePassword(customOptions) {
  var defaults = {
    length: 15,
    readable: false,
    allowSimilarChars: false,
    strictRules: true,
    contentRules: {
      numbers: true,
      mixedCase: true,
      symbols: true
    }
  };

  var options = Object.assign({}, defaults, customOptions);
  var contentRules = options.contentRules;

  var password = getRandomPassword(options);

  if (options.strictRules) {
    return checkStrictRules(password, contentRules) ? password : generatePassword(customOptions);
  }

  return password;
};

var PasswordGenerator = {
  hasNumber: hasNumber,
  hasMixedCase: hasMixedCase,
  hasSymbol: hasSymbol,
  checkStrictRules: checkStrictRules,
  buildCharset: buildCharset,
  getRandomPassword: getRandomPassword,
  generatePassword: generatePassword
};

function hexStringToUint8Array(hexString) {
  if (hexString.length % 2 !== 0) {
    throw 'Invalid hexString';
  }
  var arrayBuffer = new Uint8Array(hexString.length / 2);

  for (var i = 0; i < hexString.length; i += 2) {
    var byteValue = parseInt(hexString.substr(i, 2), 16);
    if (isNaN(byteValue)) {
      throw 'Invalid hexString';
    }
    arrayBuffer[i / 2] = byteValue;
  }

  return arrayBuffer;
}

function bytesToHexString(givenBytes) {
  if (!givenBytes) {
    return null;
  }

  var bytes = new Uint8Array(givenBytes);
  var hexBytes = [];

  for (var i = 0; i < bytes.length; ++i) {
    var byteString = bytes[i].toString(16);
    if (byteString.length < 2) {
      byteString = '0' + byteString;
    }
    hexBytes.push(byteString);
  }
  return hexBytes.join('');
}

function asciiToUint8Array(str) {
  var chars = [];
  for (var i = 0; i < str.length; ++i) {
    chars.push(str.charCodeAt(i));
  }
  return new Uint8Array(chars);
}

function bytesToASCIIString(bytes) {
  return String.fromCharCode.apply(null, new Uint8Array(bytes));
}

function generateRandomNumber(max) {
  var randomValues = new Uint8Array(1);
  crypto.getRandomValues(randomValues);
  return randomValues[0] % max;
}

function generateSeed() {
  var buf = new Uint8Array(32);
  crypto.getRandomValues(buf);

  var shift = 3;
  var carry = 0;
  var symbol = void 0;
  var byte = void 0;
  var i = void 0;
  var output = '';
  var alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

  for (i = 0; i < buf.length; i++) {
    byte = buf[i];

    symbol = carry | byte >> shift;
    output += alphabet[symbol & 0x1f];

    if (shift > 5) {
      shift -= 5;
      symbol = byte >> shift;
      output += alphabet[symbol & 0x1f];
    }

    shift = 5 - shift;
    carry = byte << shift;
    shift = 8 - shift;
  }

  if (shift !== 3) {
    output += alphabet[carry & 0x1f];
    shift = 3;
    carry = 0;
  }

  return { b32: output, raw: buf };
}

function localStorageAvailable() {
  try {
    var storage = window.localStorage;
    var x = '__storage_test__';
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch (e) {
    return false;
  }
}

function xorSeed(byteArray1, byteArray2) {
  if (byteArray1 instanceof Uint8Array && byteArray2 instanceof Uint8Array && byteArray1.length === 32 && byteArray2.length === 32) {
    var buf = new Uint8Array(32);
    var i = void 0;
    for (i = 0; i < 32; i++) {
      buf[i] = byteArray1[i] ^ byteArray2[i];
    }
    return buf;
  }
  throw 'Utils.xorSeed expect 32 bytes Uint8Arrays';
}

function escapeRegExp(s) {
  return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

var Utils = {
  generateRandomNumber: generateRandomNumber,
  generateSeed: generateSeed,
  hexStringToUint8Array: hexStringToUint8Array,
  bytesToHexString: bytesToHexString,
  asciiToUint8Array: asciiToUint8Array,
  bytesToASCIIString: bytesToASCIIString,
  xorSeed: xorSeed,
  escapeRegExp: escapeRegExp,
  PasswordGenerator: PasswordGenerator
};

function getSHA256(str) {
  var algorithm = 'SHA-256';
  var data = asciiToUint8Array(str);
  return crypto.subtle.digest(algorithm, data);
}

function genRSAOAEP() {
  var algorithm = {
    name: 'RSA-OAEP',
    modulusLength: 4096,
    publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
    hash: { name: 'SHA-256' }
  };
  var extractable = true;
  var keyUsages = ['wrapKey', 'unwrapKey', 'encrypt', 'decrypt'];
  return crypto.subtle.generateKey(algorithm, extractable, keyUsages);
}

function generateWrappingKey() {
  var algorithm = {
    name: 'AES-CBC',
    length: 256
  };

  var extractable = true;
  var keyUsages = ['wrapKey', 'unwrapKey'];

  return crypto.subtle.generateKey(algorithm, extractable, keyUsages);
}

function encryptAESGCM256(secret, key) {
  var result = {};
  var algorithm = {};
  if (typeof key === 'undefined') {
    algorithm = {
      name: 'AES-GCM',
      length: 256
    };
    var extractable = true;
    var keyUsages = ['encrypt'];
    return crypto.subtle.generateKey(algorithm, extractable, keyUsages).then(function (newKey) {
      var iv = new Uint8Array(12);
      crypto.getRandomValues(iv);
      algorithm = {
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128
      };
      var data = asciiToUint8Array(JSON.stringify(secret));
      result.key = newKey;
      result.iv = iv;
      return crypto.subtle.encrypt(algorithm, newKey, data);
    }).then(function (encryptedSecret) {
      result.secret = encryptedSecret;
      return result;
    });
  }

  result.key = key;
  var iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  algorithm = {
    name: 'AES-GCM',
    iv: iv,
    tagLength: 128
  };
  var data = asciiToUint8Array(JSON.stringify(secret));
  result.iv = iv;
  return crypto.subtle.encrypt(algorithm, key, data).then(function (encryptedSecret) {
    result.secret = encryptedSecret;
    return result;
  });
}

function decryptAESGCM256(secretObject, key) {
  var algorithm = {
    name: 'AES-GCM',
    iv: hexStringToUint8Array(secretObject.iv),
    tagLength: 128
  };
  var data = hexStringToUint8Array(secretObject.secret);
  return crypto.subtle.decrypt(algorithm, key, data);
}

function encryptRSAOAEP(secret, publicKey) {
  var algorithm = {
    name: 'RSA-OAEP',
    hash: { name: 'SHA-256' }
  };
  var data = asciiToUint8Array(secret);
  return crypto.subtle.encrypt(algorithm, publicKey, data);
}

function decryptRSAOAEP(secret, privateKey) {
  var algorithm = {
    name: 'RSA-OAEP',
    hash: { name: 'SHA-256' }
  };
  var data = hexStringToUint8Array(secret);
  return crypto.subtle.decrypt(algorithm, privateKey, data);
}

function wrapRSAOAEP(key, wrappingPublicKey) {
  var format = 'raw';
  var wrapAlgorithm = {
    name: 'RSA-OAEP',
    hash: { name: 'SHA-256' }
  };
  return crypto.subtle.wrapKey(format, key, wrappingPublicKey, wrapAlgorithm);
}

function _sign(datas, key) {
  var signAlgorithm = {
    name: 'RSA-PSS',
    saltLength: 32 };
  return crypto.subtle.sign(signAlgorithm, key, asciiToUint8Array(datas));
}

function _verify(datas, signature, key) {
  var signAlgorithm = {
    name: 'RSA-PSS',
    saltLength: 32 };
  return crypto.subtle.verify(signAlgorithm, key, hexStringToUint8Array(signature), asciiToUint8Array(datas));
}

function unwrapRSAOAEP(wrappedKeyHex, unwrappingPrivateKey) {
  var format = 'raw';
  var wrappedKey = hexStringToUint8Array(wrappedKeyHex);
  var unwrapAlgorithm = {
    name: 'RSA-OAEP',
    hash: { name: 'SHA-256' }
  };
  var unwrappedKeyAlgorithm = {
    name: 'AES-GCM',
    length: 256
  };
  var extractable = true;
  var usages = ['decrypt', 'encrypt'];

  return crypto.subtle.unwrapKey(format, wrappedKey, unwrappingPrivateKey, unwrapAlgorithm, unwrappedKeyAlgorithm, extractable, usages);
}

function exportClearKey(key) {
  var format = 'jwk';
  return crypto.subtle.exportKey(format, key);
}

function convertOAEPToPSS(key, keyUsage) {
  return exportClearKey(key).then(function (OAEPKey) {
    var format = 'jwk';
    var algorithm = {
      name: 'RSA-PSS',
      hash: { name: 'SHA-256' }
    };
    var extractable = false;
    var keyUsages = [keyUsage];

    var PSSKey = OAEPKey;
    PSSKey.alg = 'PS256';
    PSSKey.key_ops = keyUsages;

    return crypto.subtle.importKey(format, PSSKey, algorithm, extractable, keyUsages);
  });
}

function _importPublicKey(jwkPublicKey) {
  var format = 'jwk';
  var algorithm = {
    name: 'RSA-OAEP',
    hash: { name: 'SHA-256' }
  };
  var extractable = true;
  var keyUsages = ['wrapKey', 'encrypt'];
  return crypto.subtle.importKey(format, jwkPublicKey, algorithm, extractable, keyUsages);
}

function derivePassword(password, parameters) {
  var result = {};

  var passwordBuf = asciiToUint8Array(password);
  var extractable = false;
  var usages = ['deriveKey', 'deriveBits'];

  return crypto.subtle.importKey('raw', passwordBuf, { name: 'PBKDF2' }, extractable, usages).then(function (key) {
    var saltBuf = void 0;
    var iterations = void 0;
    if (typeof parameters === 'undefined') {
      saltBuf = new Uint8Array(32);
      crypto.getRandomValues(saltBuf);
      var iterationsBuf = new Uint8Array(1);
      crypto.getRandomValues(iterationsBuf);
      iterations = 100000 + iterationsBuf[0];
    } else {
      saltBuf = hexStringToUint8Array(parameters.salt);
      if (typeof parameters.iterations === 'undefined') {
        iterations = 10000; // retrocompatibility
      } else {
        iterations = parameters.iterations;
      }
    }

    result.salt = saltBuf;
    result.iterations = iterations;

    var algorithm = {
      name: 'PBKDF2',
      salt: saltBuf,
      iterations: iterations,
      hash: { name: 'SHA-256' }
    };

    var deriveKeyAlgorithm = {
      name: 'AES-CBC',
      length: 256
    };

    extractable = true;
    usages = ['wrapKey', 'unwrapKey'];

    return crypto.subtle.deriveKey(algorithm, key, deriveKeyAlgorithm, extractable, usages);
  }).then(function (dKey) {
    result.key = dKey;
    return crypto.subtle.exportKey('raw', dKey);
  }).then(function (rawKey) {
    return crypto.subtle.digest('SHA-256', rawKey);
  }).then(function (hashedKey) {
    result.hash = hashedKey;
    return result;
  });
}

function exportKey(wrappingKey, key) {
  var result = {};
  var format = 'jwk';
  var iv = new Uint8Array(16);
  crypto.getRandomValues(iv);
  var wrapAlgorithm = {
    name: 'AES-CBC',
    iv: iv
  };
  result.iv = iv;
  return crypto.subtle.wrapKey(format, key, wrappingKey, wrapAlgorithm).then(function (wrappedKey) {
    result.key = wrappedKey;
    return result;
  });
}

function _importPrivateKey(key, privateKeyObject) {
  var format = 'jwk';
  var wrappedPrivateKey = hexStringToUint8Array(privateKeyObject.privateKey);
  var unwrapAlgorithm = {
    name: 'AES-CBC',
    iv: hexStringToUint8Array(privateKeyObject.iv)
  };
  var unwrappedKeyAlgorithm = {
    name: 'RSA-OAEP',
    hash: { name: 'sha-256' }
  };
  var extractable = true;
  var keyUsages = ['unwrapKey', 'decrypt'];

  return crypto.subtle.unwrapKey(format, wrappedPrivateKey, key, unwrapAlgorithm, unwrappedKeyAlgorithm, extractable, keyUsages).catch(function () {
    return Promise.reject('Invalid Password');
  });
}

function importKey(key, keyObject) {
  var format = 'jwk';
  var wrappedKey = hexStringToUint8Array(keyObject.key);
  var unwrapAlgorithm = {
    name: 'AES-CBC',
    iv: hexStringToUint8Array(keyObject.iv)
  };
  var unwrappedKeyAlgorithm = unwrapAlgorithm;
  var extractable = true;
  var keyUsages = ['wrapKey', 'unwrapKey'];

  return crypto.subtle.unwrapKey(format, wrappedKey, key, unwrapAlgorithm, unwrappedKeyAlgorithm, extractable, keyUsages).catch(function () {
    return Promise.reject('Invalid Password');
  });
}

var Error = function Error(errorObject) {
  classCallCheck(this, Error);

  this.message = 'Unknown error';
  if (typeof errorObject !== 'undefined') {
    this.errorObject = errorObject;
  } else {
    this.errorObject = null;
  }
};

var ServerUnknownError = function (_Error) {
  inherits(ServerUnknownError, _Error);

  function ServerUnknownError() {
    classCallCheck(this, ServerUnknownError);

    var _this = possibleConstructorReturn(this, _Error.call(this));

    _this.message = 'Server error';
    return _this;
  }

  return ServerUnknownError;
}(Error);

var UserNotFoundError = function (_Error2) {
  inherits(UserNotFoundError, _Error2);

  function UserNotFoundError() {
    classCallCheck(this, UserNotFoundError);

    var _this2 = possibleConstructorReturn(this, _Error2.call(this));

    _this2.message = 'User not found';
    return _this2;
  }

  return UserNotFoundError;
}(Error);

var UsernameAlreadyExistsError = function (_Error3) {
  inherits(UsernameAlreadyExistsError, _Error3);

  function UsernameAlreadyExistsError() {
    classCallCheck(this, UsernameAlreadyExistsError);

    var _this3 = possibleConstructorReturn(this, _Error3.call(this));

    _this3.message = 'Username already exists';
    return _this3;
  }

  return UsernameAlreadyExistsError;
}(Error);

var NeedTOTPTokenError = function (_Error4) {
  inherits(NeedTOTPTokenError, _Error4);

  function NeedTOTPTokenError() {
    classCallCheck(this, NeedTOTPTokenError);

    var _this4 = possibleConstructorReturn(this, _Error4.call(this));

    _this4.message = 'Need TOTP token';
    return _this4;
  }

  return NeedTOTPTokenError;
}(Error);

var DisconnectedError = function (_Error5) {
  inherits(DisconnectedError, _Error5);

  function DisconnectedError() {
    classCallCheck(this, DisconnectedError);

    var _this5 = possibleConstructorReturn(this, _Error5.call(this));

    _this5.message = 'You are disconnected';
    return _this5;
  }

  return DisconnectedError;
}(Error);

var InvalidSignatureError = function (_Error6) {
  inherits(InvalidSignatureError, _Error6);

  function InvalidSignatureError() {
    classCallCheck(this, InvalidSignatureError);

    var _this6 = possibleConstructorReturn(this, _Error6.call(this));

    _this6.message = 'Invalid signature';
    return _this6;
  }

  return InvalidSignatureError;
}(Error);

var DontHaveSecretError = function (_Error7) {
  inherits(DontHaveSecretError, _Error7);

  function DontHaveSecretError() {
    classCallCheck(this, DontHaveSecretError);

    var _this7 = possibleConstructorReturn(this, _Error7.call(this));

    _this7.message = 'You don\'t have this secret';
    return _this7;
  }

  return DontHaveSecretError;
}(Error);

var FolderNotFoundError = function (_Error8) {
  inherits(FolderNotFoundError, _Error8);

  function FolderNotFoundError() {
    classCallCheck(this, FolderNotFoundError);

    var _this8 = possibleConstructorReturn(this, _Error8.call(this));

    _this8.message = 'Folder not found';
    return _this8;
  }

  return FolderNotFoundError;
}(Error);

var FolderInItselfError = function (_Error9) {
  inherits(FolderInItselfError, _Error9);

  function FolderInItselfError() {
    classCallCheck(this, FolderInItselfError);

    var _this9 = possibleConstructorReturn(this, _Error9.call(this));

    _this9.message = 'You can\'t put this folder in itself.';
    return _this9;
  }

  return FolderInItselfError;
}(Error);

var LocalStorageUnavailableError = function (_Error10) {
  inherits(LocalStorageUnavailableError, _Error10);

  function LocalStorageUnavailableError() {
    classCallCheck(this, LocalStorageUnavailableError);

    var _this10 = possibleConstructorReturn(this, _Error10.call(this));

    _this10.message = 'LocalStorage unavailable';
    return _this10;
  }

  return LocalStorageUnavailableError;
}(Error);

var InvalidPasswordError = function (_Error11) {
  inherits(InvalidPasswordError, _Error11);

  function InvalidPasswordError() {
    classCallCheck(this, InvalidPasswordError);

    var _this11 = possibleConstructorReturn(this, _Error11.call(this));

    _this11.message = 'Invalid password';
    return _this11;
  }

  return InvalidPasswordError;
}(Error);

var CantEditSecretError = function (_Error12) {
  inherits(CantEditSecretError, _Error12);

  function CantEditSecretError() {
    classCallCheck(this, CantEditSecretError);

    var _this12 = possibleConstructorReturn(this, _Error12.call(this));

    _this12.message = 'You can\'t edit this secret';
    return _this12;
  }

  return CantEditSecretError;
}(Error);

var CantShareSecretError = function (_Error13) {
  inherits(CantShareSecretError, _Error13);

  function CantShareSecretError() {
    classCallCheck(this, CantShareSecretError);

    var _this13 = possibleConstructorReturn(this, _Error13.call(this));

    _this13.message = 'You can\'t share this secret';
    return _this13;
  }

  return CantShareSecretError;
}(Error);

var CantUnshareSecretError = function (_Error14) {
  inherits(CantUnshareSecretError, _Error14);

  function CantUnshareSecretError() {
    classCallCheck(this, CantUnshareSecretError);

    var _this14 = possibleConstructorReturn(this, _Error14.call(this));

    _this14.message = 'You can\'t unshare this secret';
    return _this14;
  }

  return CantUnshareSecretError;
}(Error);

var CantUnshareWithYourselfError = function (_Error15) {
  inherits(CantUnshareWithYourselfError, _Error15);

  function CantUnshareWithYourselfError() {
    classCallCheck(this, CantUnshareWithYourselfError);

    var _this15 = possibleConstructorReturn(this, _Error15.call(this));

    _this15.message = 'You can\'t unshare with yourself';
    return _this15;
  }

  return CantUnshareWithYourselfError;
}(Error);

var CantShareWithYourselfError = function (_Error16) {
  inherits(CantShareWithYourselfError, _Error16);

  function CantShareWithYourselfError() {
    classCallCheck(this, CantShareWithYourselfError);

    var _this16 = possibleConstructorReturn(this, _Error16.call(this));

    _this16.message = 'You can\'t share with yourself';
    return _this16;
  }

  return CantShareWithYourselfError;
}(Error);

var SecretAlreadyExistsError = function (_Error17) {
  inherits(SecretAlreadyExistsError, _Error17);

  function SecretAlreadyExistsError() {
    classCallCheck(this, SecretAlreadyExistsError);

    var _this17 = possibleConstructorReturn(this, _Error17.call(this));

    _this17.message = 'Wow you are unlucky ! SecretID already exists';
    return _this17;
  }

  return SecretAlreadyExistsError;
}(Error);

var SecretNotFoundError = function (_Error18) {
  inherits(SecretNotFoundError, _Error18);

  function SecretNotFoundError() {
    classCallCheck(this, SecretNotFoundError);

    var _this18 = possibleConstructorReturn(this, _Error18.call(this));

    _this18.message = 'Secret not found';
    return _this18;
  }

  return SecretNotFoundError;
}(Error);

var CantGenerateNewKeyError = function (_Error19) {
  inherits(CantGenerateNewKeyError, _Error19);

  function CantGenerateNewKeyError() {
    classCallCheck(this, CantGenerateNewKeyError);

    var _this19 = possibleConstructorReturn(this, _Error19.call(this));

    _this19.message = 'You can\'t generate new key for this secret';
    return _this19;
  }

  return CantGenerateNewKeyError;
}(Error);

var NotSharedWithUserError = function (_Error20) {
  inherits(NotSharedWithUserError, _Error20);

  function NotSharedWithUserError() {
    classCallCheck(this, NotSharedWithUserError);

    var _this20 = possibleConstructorReturn(this, _Error20.call(this));

    _this20.message = 'You didn\'t share this secret with this user';
    return _this20;
  }

  return NotSharedWithUserError;
}(Error);

var FriendNotFoundError = function (_Error21) {
  inherits(FriendNotFoundError, _Error21);

  function FriendNotFoundError() {
    classCallCheck(this, FriendNotFoundError);

    var _this21 = possibleConstructorReturn(this, _Error21.call(this));

    _this21.message = 'Friend not found';
    return _this21;
  }

  return FriendNotFoundError;
}(Error);

var WrappingError = function WrappingError(error) {
  classCallCheck(this, WrappingError);

  if (error.constructor !== String) {
    this.error = error;
  } else if (error === 'Unknown error') {
    this.error = new ServerUnknownError();
  } else if (error === 'User not found') {
    this.error = new UserNotFoundError();
  } else if (error === 'Username already exists') {
    this.error = new UsernameAlreadyExistsError();
  } else if (error === 'Need TOTP token') {
    this.error = new NeedTOTPTokenError();
  } else if (error === 'You are disconnected') {
    this.error = new DisconnectedError();
  } else if (error === 'Invalid signature') {
    this.error = new InvalidSignatureError();
  } else if (error === 'You don\'t have this secret') {
    this.error = new DontHaveSecretError();
  } else if (error === 'Folder not found') {
    this.error = new FolderNotFoundError();
  } else if (error === 'You can\'t put this folder in itself.') {
    this.error = new FolderInItselfError();
  } else if (error === 'LocalStorage unavailable') {
    this.error = new LocalStorageUnavailableError();
  } else if (error === 'Invalid Password') {
    this.error = new InvalidPasswordError();
  } else if (error === 'You can\'t edit this secret') {
    this.error = new CantEditSecretError();
  } else if (error === 'You can\'t share this secret') {
    this.error = new CantShareSecretError();
  } else if (error === 'You can\'t unshare this secret') {
    this.error = new CantUnshareSecretError();
  } else if (error === 'You can\'t unshare with yourself') {
    this.error = new CantUnshareWithYourselfError();
  } else if (error === 'You can\'t share with yourself') {
    this.error = new CantShareWithYourselfError();
  } else if (error === 'Secret already exists') {
    this.error = new SecretAlreadyExistsError();
  } else if (error === 'Secret not found') {
    this.error = new SecretNotFoundError();
  } else if (error === 'You can\'t generate new key for this secret') {
    this.error = new CantGenerateNewKeyError();
  } else if (error === 'You didn\'t share this secret with this user') {
    this.error = new NotSharedWithUserError();
  } else if (error === 'Friend not found') {
    this.error = new FriendNotFoundError();
  } else {
    this.error = new Error(error);
  }
};

var Errors = {
  Error: Error,
  ServerUnknownError: ServerUnknownError,
  UserNotFoundError: UserNotFoundError,
  UsernameAlreadyExistsError: UsernameAlreadyExistsError,
  NeedTOTPTokenError: NeedTOTPTokenError,
  DisconnectedError: DisconnectedError,
  InvalidSignatureError: InvalidSignatureError,
  DontHaveSecretError: DontHaveSecretError,
  FolderNotFoundError: FolderNotFoundError,
  FolderInItselfError: FolderInItselfError,
  LocalStorageUnavailableError: LocalStorageUnavailableError,
  WrappingError: WrappingError,
  InvalidPasswordError: InvalidPasswordError,
  CantEditSecretError: CantEditSecretError,
  CantShareSecretError: CantShareSecretError,
  CantUnshareSecretError: CantUnshareSecretError,
  CantUnshareWithYourselfError: CantUnshareWithYourselfError,
  CantShareWithYourselfError: CantShareWithYourselfError,
  SecretAlreadyExistsError: SecretAlreadyExistsError,
  SecretNotFoundError: SecretNotFoundError,
  CantGenerateNewKeyError: CantGenerateNewKeyError,
  NotSharedWithUserError: NotSharedWithUserError,
  FriendNotFoundError: FriendNotFoundError
};

var API = function () {
  function API(db) {
    classCallCheck(this, API);

    if (typeof db === 'object') {
      this.db = db;
    } else {
      this.db = { users: {}, secrets: {} };
    }
  }

  API.prototype.userExists = function userExists(username, isHashed) {
    return this.retrieveUser(username, 'undefined', isHashed).then(function () {
      return true;
    }, function () {
      return false;
    });
  };

  API.prototype.addUser = function addUser(username, privateKey, publicKey, pass, options) {
    var _this = this;

    var hashedUsername = void 0;
    return getSHA256(username).then(function (rHashedUsername) {
      hashedUsername = rHashedUsername;
      return new Promise(function (resolve, reject) {
        if (typeof _this.db.users[bytesToHexString(hashedUsername)] === 'undefined') {
          resolve(getSHA256(pass.hash));
        } else {
          reject('Username already exists');
        }
      });
    }).then(function (hashedHash) {
      _this.db.users[bytesToHexString(hashedUsername)] = {
        pass: {
          salt: pass.salt,
          hash: bytesToHexString(hashedHash),
          iterations: pass.iterations
        },
        privateKey: privateKey,
        publicKey: publicKey,
        keys: {},
        options: options
      };
    });
  };

  API.prototype.addSecret = function addSecret(user, secretObject) {
    var _this2 = this;

    return new Promise(function (resolve, reject) {
      if (typeof _this2.db.users[secretObject.hashedUsername] !== 'undefined') {
        if (typeof _this2.db.secrets[secretObject.hashedTitle] === 'undefined') {
          _this2.db.secrets[secretObject.hashedTitle] = {
            secret: secretObject.secret,
            metadatas: secretObject.metadatas,
            iv: secretObject.iv,
            iv_meta: secretObject.iv_meta,
            users: [secretObject.hashedUsername]
          };
          _this2.db.users[secretObject.hashedUsername].keys[secretObject.hashedTitle] = {
            key: secretObject.wrappedKey,
            rights: 2
          };
          resolve();
        }
        reject('Secret already exists');
      } else {
        reject('User not found');
      }
    });
  };

  API.prototype.deleteSecret = function deleteSecret(user, hashedTitle) {
    var _this3 = this;

    var hashedUsername = void 0;
    return getSHA256(user.username).then(function (rHashedUsername) {
      hashedUsername = bytesToHexString(rHashedUsername);
      if (typeof _this3.db.users[hashedUsername] !== 'undefined') {
        if (typeof _this3.db.secrets[hashedTitle] === 'undefined') {
          return Promise.reject('Secret not found');
        }
        delete _this3.db.users[hashedUsername].keys[hashedTitle];
        var index = _this3.db.secrets[hashedTitle].users.indexOf(hashedUsername);
        if (index > -1) {
          _this3.db.secrets[hashedTitle].users.splice(index, 1);
        }
        if (_this3.db.secrets[hashedTitle].users.length === 0) {
          delete _this3.db.secrets[hashedTitle];
        }
        return Promise.resolve();
      }
      return Promise.reject('User not found');
    });
  };

  API.prototype.getNewChallenge = function getNewChallenge(user) {
    return getSHA256(user.username).then(function () {
      var rawChallenge = new Uint8Array(32);
      crypto.getRandomValues(rawChallenge);
      var challenge = bytesToASCIIString(rawChallenge);
      return encryptRSAOAEP(challenge, user.publicKey);
    }).then(function (encryptedChallenge) {
      return {
        time: Date.now().toString(),
        value: bytesToHexString(encryptedChallenge)
      };
    });
  };

  API.prototype.editSecret = function editSecret(user, secretObject, hashedTitle) {
    var _this4 = this;

    var hashedUsername = void 0;
    return getSHA256(user.username).then(function (rHashedUsername) {
      hashedUsername = bytesToHexString(rHashedUsername);
      if (typeof _this4.db.users[hashedUsername] !== 'undefined') {
        if (typeof _this4.db.secrets[hashedTitle] !== 'undefined') {
          if (typeof _this4.db.users[hashedUsername].keys[hashedTitle].rights === 'undefined' || _this4.db.users[hashedUsername].keys[hashedTitle].rights <= 0) {
            return Promise.reject('You can\'t edit this secret');
          }
          _this4.db.secrets[hashedTitle].iv = secretObject.iv;
          _this4.db.secrets[hashedTitle].secret = secretObject.secret;
          _this4.db.secrets[hashedTitle].iv_meta = secretObject.iv_meta;
          _this4.db.secrets[hashedTitle].metadatas = secretObject.metadatas;
          return Promise.resolve();
        }
        return Promise.reject('Secret not found');
      }
      return Promise.reject('User not found');
    });
  };

  API.prototype.newKey = function newKey(user, hashedTitle, secret, wrappedKeys) {
    var _this5 = this;

    var hashedUsername = void 0;
    return getSHA256(user.username).then(function (rHashedUsername) {
      hashedUsername = bytesToHexString(rHashedUsername);
      if (typeof _this5.db.users[hashedUsername] !== 'undefined') {
        if (typeof _this5.db.secrets[hashedTitle] !== 'undefined') {
          if (typeof _this5.db.users[hashedUsername].keys[hashedTitle].rights === 'undefined' || _this5.db.users[hashedUsername].keys[hashedTitle].rights <= 1) {
            return Promise.reject('You can\'t generate new key for this secret');
          }
          _this5.db.secrets[hashedTitle].iv = secret.iv;
          _this5.db.secrets[hashedTitle].secret = secret.secret;
          _this5.db.secrets[hashedTitle].iv_meta = secret.iv_meta;
          _this5.db.secrets[hashedTitle].metadatas = secret.metadatas;
          wrappedKeys.forEach(function (wrappedKey) {
            if (typeof _this5.db.users[wrappedKey.user] !== 'undefined') {
              if (typeof _this5.db.users[wrappedKey.user].keys[hashedTitle] !== 'undefined') {
                _this5.db.users[wrappedKey.user].keys[hashedTitle].key = wrappedKey.key;
              }
            }
          });
          return Promise.resolve();
        }
        return Promise.reject('Secret not found');
      }
      return Promise.reject('User not found');
    });
  };

  API.prototype.unshareSecret = function unshareSecret(user, friendNames, hashedTitle) {
    var _this6 = this;

    var hashedUsername = void 0;
    var hashedFriendUsernames = [];
    return getSHA256(user.username).then(function (rHashedUsername) {
      hashedUsername = bytesToHexString(rHashedUsername);
      var hashedFriendUseramePromises = [];
      friendNames.forEach(function (username) {
        hashedFriendUseramePromises.push(getSHA256(username));
      });
      return Promise.all(hashedFriendUseramePromises);
    }).then(function (rHashedFriendUserames) {
      rHashedFriendUserames.forEach(function (hashedFriendUserame) {
        hashedFriendUsernames.push(bytesToHexString(hashedFriendUserame));
      });
      if (typeof _this6.db.users[hashedUsername] !== 'undefined') {
        if (typeof _this6.db.secrets[hashedTitle] !== 'undefined') {
          if (typeof _this6.db.users[hashedUsername].keys[hashedTitle].rights !== 'undefined' && _this6.db.users[hashedUsername].keys[hashedTitle].rights > 1) {
            var yourself = 0;
            var nb = 0;
            var response = 'Secret unshared';
            hashedFriendUsernames.forEach(function (hashedFriendUsername) {
              if (hashedUsername !== hashedFriendUsername) {
                var dbUser = _this6.db.users[hashedFriendUsername];
                if (typeof dbUser !== 'undefined') {
                  if (typeof dbUser.keys[hashedTitle] !== 'undefined') {
                    delete dbUser.keys[hashedTitle];
                    var id = _this6.db.secrets[hashedTitle].users.indexOf(hashedFriendUsername);
                    _this6.db.secrets[hashedTitle].users.splice(id, 1);
                    nb += 1;
                  } else {
                    throw 'You didn\'t share this secret with this user';
                  }
                } else {
                  throw 'Friend not found';
                }
              } else {
                yourself = 1;
                if (hashedFriendUsernames.length === 1) {
                  response = 'You can\'t unshare with yourself';
                }
              }
            });
            if (nb === hashedFriendUsernames.length - yourself) {
              return response;
            }
            return Promise.reject('Something goes wrong.');
          }
          return Promise.reject('You can\'t unshare this secret');
        }
        return Promise.reject('Secret not found');
      }
      return Promise.reject('User not found');
    });
  };

  API.prototype.shareSecret = function shareSecret(user, sharedSecretObjects) {
    var _this7 = this;

    var hashedUsername = void 0;
    return getSHA256(user.username).then(function (rHashedUsername) {
      hashedUsername = bytesToHexString(rHashedUsername);
      var dbUser = _this7.db.users[hashedUsername];
      if (typeof dbUser !== 'undefined') {
        var nb = 0;
        sharedSecretObjects.forEach(function (sharedSecretObject) {
          if (sharedSecretObject.friendName !== hashedUsername) {
            if (typeof _this7.db.secrets[sharedSecretObject.hashedTitle] !== 'undefined') {
              if (typeof dbUser.keys[sharedSecretObject.hashedTitle].rights !== 'undefined' && dbUser.keys[sharedSecretObject.hashedTitle].rights > 1) {
                var dbFriend = _this7.db.users[sharedSecretObject.friendName];
                if (typeof dbFriend !== 'undefined') {
                  dbFriend.keys[sharedSecretObject.hashedTitle] = {
                    key: sharedSecretObject.wrappedKey,
                    rights: sharedSecretObject.rights
                  };
                  var users = _this7.db.secrets[sharedSecretObject.hashedTitle].users;
                  if (users.indexOf(sharedSecretObject.friendName) < 0) {
                    users.push(sharedSecretObject.friendName);
                  }
                  nb += 1;
                } else {
                  throw 'Friend not found';
                }
              } else {
                throw 'You can\'t share this secret';
              }
            } else {
              throw 'Secret not found';
            }
          } else {
            throw 'You can\'t share with yourself';
          }
        });
        if (nb !== sharedSecretObjects.length) {
          return Promise.reject('Something goes wrong.');
        }
        return Promise.resolve();
      }
      return Promise.reject('User not found');
    });
  };

  API.prototype.retrieveUser = function retrieveUser(username, hash, hashed) {
    var _this8 = this;

    var hashedUsername = username;
    var user = void 0;
    var isHashed = Promise.resolve();

    if (!hashed) {
      isHashed = isHashed.then(function () {
        return getSHA256(username);
      }).then(function (rHashedUsername) {
        hashedUsername = bytesToHexString(rHashedUsername);
      });
    }

    return isHashed.then(function () {
      if (typeof _this8.db.users[hashedUsername] === 'undefined') {
        return Promise.reject('User not found');
      }
      user = JSON.parse(JSON.stringify(_this8.db.users[hashedUsername]));
      return getSHA256(hash);
    }).then(function (hashedHash) {
      if (bytesToHexString(hashedHash) === user.pass.hash) {
        var _ret = function () {
          var metadatas = {};
          var hashedTitles = Object.keys(user.keys);
          hashedTitles.forEach(function (hashedTitle) {
            var secret = _this8.db.secrets[hashedTitle];
            metadatas[hashedTitle] = {
              iv: secret.iv_meta,
              secret: secret.metadatas
            };
          });
          user.metadatas = metadatas;
          return {
            v: user
          };
        }();

        if (typeof _ret === "object") return _ret.v;
      }
      var fakePrivateKey = new Uint8Array(3232);
      var fakeIV = new Uint8Array(16);
      var fakeHash = new Uint8Array(32);
      crypto.getRandomValues(fakePrivateKey);
      crypto.getRandomValues(fakeIV);
      crypto.getRandomValues(fakeHash);
      user.privateKey = {
        privateKey: bytesToHexString(fakePrivateKey),
        iv: bytesToHexString(fakeIV)
      };
      user.keys = {};
      user.metadatas = {};
      user.pass.hash = fakeHash;
      return user;
    });
  };

  API.prototype.getDerivationParameters = function getDerivationParameters(username, isHashed) {
    return this.retrieveUser(username, 'undefined', isHashed).then(function (user) {
      return {
        totp: user.pass.totp,
        salt: user.pass.salt,
        iterations: user.pass.iterations
      };
    });
  };

  API.prototype.getPublicKey = function getPublicKey(username, isHashed) {
    return this.retrieveUser(username, 'undefined', isHashed).then(function (user) {
      return user.publicKey;
    });
  };

  API.prototype.getUser = function getUser(username, hash) {
    return this.retrieveUser(username, hash, false);
  };

  API.prototype.getUserWithSignature = function getUserWithSignature(user) {
    var _this9 = this;

    var hashedUsername = void 0;
    return getSHA256(user.username).then(function (rHashedUsername) {
      hashedUsername = bytesToHexString(rHashedUsername);
      return new Promise(function (resolve, reject) {
        if (typeof _this9.db.users[hashedUsername] === 'undefined') {
          reject('User not found');
        } else {
          (function () {
            var userObject = JSON.parse(JSON.stringify(_this9.db.users[hashedUsername]));
            var metadatas = {};
            var hashedTitles = Object.keys(user.keys);
            hashedTitles.forEach(function (hashedTitle) {
              var secret = _this9.db.secrets[hashedTitle];
              metadatas[hashedTitle] = {
                iv: secret.iv_meta,
                secret: secret.metadatas
              };
            });
            userObject.metadatas = metadatas;
            resolve(userObject);
          })();
        }
      });
    });
  };

  API.prototype.getSecret = function getSecret(hash, user) {
    var _this10 = this;

    return user.sign(hash).then(function () {
      return new Promise(function (resolve, reject) {
        if (typeof _this10.db.secrets[hash] === 'undefined') {
          reject('You don\'t have this secret');
        } else {
          resolve(_this10.db.secrets[hash]);
        }
      });
    });
  };

  API.prototype.getAllMetadatas = function getAllMetadatas(user) {
    var _this11 = this;

    var result = {};
    return new Promise(function (resolve) {
      var hashedTitles = Object.keys(user.keys);
      hashedTitles.forEach(function (hashedTitle) {
        var secret = _this11.db.secrets[hashedTitle];
        result[hashedTitle] = {
          iv: secret.iv_meta,
          secret: secret.metadatas
        };
      });
      resolve(result);
    });
  };

  API.prototype.getDb = function getDb() {
    var _this12 = this;

    return new Promise(function (resolve) {
      resolve(_this12.db);
    });
  };

  API.prototype.editUser = function editUser(user, datas, type) {
    var _this13 = this;

    var hashedUsername = void 0;
    return getSHA256(user.username).then(function (rHashedUsername) {
      hashedUsername = bytesToHexString(rHashedUsername);
      return new Promise(function (resolve, reject) {
        if (typeof _this13.db.users[hashedUsername] !== 'undefined') {
          if (type === 'password') {
            resolve(_this13.changePassword(hashedUsername, datas.privateKey, datas.pass));
          } else {
            _this13.db.users[hashedUsername].options = datas;
            resolve();
          }
        } else {
          reject('User not found');
        }
      });
    });
  };

  API.prototype.changePassword = function changePassword(hashedUsername, privateKey, pass) {
    var _this14 = this;

    return getSHA256(pass.hash).then(function (hashedHash) {
      var newPass = pass;
      newPass.hash = bytesToHexString(hashedHash);
      _this14.db.users[hashedUsername].privateKey = privateKey;
      _this14.db.users[hashedUsername].pass = newPass;
    });
  };

  return API;
}();

var User = function () {
  function User(username) {
    classCallCheck(this, User);

    this.username = username;
    this.publicKey = null;
    this.publicKeySign = null;
    this.privateKey = null;
    this.privateKeySign = null;
    this.keys = {};
    this.hash = '';
    this.totp = false;
    this.metadatas = {};
    this.options = User.defaultOptions;
  }

  User.prototype.disconnect = function disconnect() {
    delete this.username;
    delete this.publicKey;
    delete this.publicKeySign;
    delete this.privateKey;
    delete this.privateKeySign;
    delete this.metadatas;
    delete this.keys;
    delete this.hash;
    delete this.totp;
    delete this.options;
  };

  User.prototype.sign = function sign(datas) {
    return _sign(datas, this.privateKeySign);
  };

  User.prototype.verify = function verify(datas, signature) {
    return _verify(datas, signature, this.publicKeySign);
  };

  User.prototype.generateMasterKey = function generateMasterKey() {
    var _this = this;

    return genRSAOAEP().then(function (keyPair) {
      _this.publicKey = keyPair.publicKey;
      _this.privateKey = keyPair.privateKey;
      return convertOAEPToPSS(_this.privateKey, 'sign');
    }).then(function (privateKeySign) {
      _this.privateKeySign = privateKeySign;
      return convertOAEPToPSS(_this.publicKey, 'verify');
    }).then(function (publicKeySign) {
      _this.publicKeySign = publicKeySign;
    });
  };

  User.prototype.exportPublicKey = function exportPublicKey() {
    return exportClearKey(this.publicKey);
  };

  User.prototype.importPublicKey = function importPublicKey(jwkPublicKey) {
    var _this2 = this;

    return _importPublicKey(jwkPublicKey).then(function (publicKey) {
      _this2.publicKey = publicKey;
      return convertOAEPToPSS(_this2.publicKey, 'verify');
    }).then(function (publicKeySign) {
      _this2.publicKeySign = publicKeySign;
    });
  };

  User.prototype.exportPrivateKey = function exportPrivateKey(password) {
    var _this3 = this;

    var pass = {};
    return derivePassword(password).then(function (dKey) {
      pass.salt = bytesToHexString(dKey.salt);
      _this3.hash = bytesToHexString(dKey.hash);
      pass.hash = _this3.hash;
      pass.iterations = dKey.iterations;
      return exportKey(dKey.key, _this3.privateKey);
    }).then(function (keyObject) {
      return {
        privateKey: {
          privateKey: bytesToHexString(keyObject.key),
          iv: bytesToHexString(keyObject.iv)
        },
        pass: pass
      };
    });
  };

  User.prototype.importPrivateKey = function importPrivateKey(dKey, privateKeyObject) {
    var _this4 = this;

    return _importPrivateKey(dKey, privateKeyObject).then(function (privateKey) {
      _this4.privateKey = privateKey;
      return convertOAEPToPSS(_this4.privateKey, 'sign');
    }).then(function (privateKeySign) {
      _this4.privateKeySign = privateKeySign;
    });
  };

  User.prototype.exportOptions = function exportOptions() {
    var _this5 = this;

    var result = {};
    return encryptRSAOAEP(JSON.stringify(this.options), this.publicKey).then(function (encryptedOptions) {
      result.options = bytesToHexString(encryptedOptions);
      return _this5.sign(result.options);
    }).then(function (signature) {
      result.signature = bytesToHexString(signature);
      return result;
    });
  };

  User.prototype.importOptions = function importOptions(optionsObject) {
    var _this6 = this;

    // Retro compatibility
    if (typeof optionsObject === 'undefined') {
      this.options = User.defaultOptions;
      return Promise.resolve(null);
    }
    return this.verify(optionsObject.options, optionsObject.signature).then(function (verified) {
      if (verified) {
        return decryptRSAOAEP(optionsObject.options, _this6.privateKey);
      }
      return null;
    }).then(function (options) {
      if (options) {
        _this6.options = JSON.parse(bytesToASCIIString(options));
      } else {
        _this6.options = User.defaultOptions;
      }
    });
  };

  User.prototype.shareSecret = function shareSecret(friend, wrappedKey, hashedTitle) {
    var _this7 = this;

    var result = { hashedTitle: hashedTitle };
    return this.unwrapKey(wrappedKey).then(function (key) {
      return _this7.wrapKey(key, friend.publicKey);
    }).then(function (friendWrappedKey) {
      result.wrappedKey = friendWrappedKey;
      return getSHA256(friend.username);
    }).then(function (hashedUsername) {
      result.friendName = bytesToHexString(hashedUsername);
      return result;
    });
  };

  User.prototype.editSecret = function editSecret(hashedTitle, secret) {
    var _this8 = this;

    var metadatas = this.metadatas[hashedTitle];
    if (typeof metadatas === 'undefined') {
      return Promise.reject('You don\'t have this secret');
    }
    var now = new Date();
    metadatas.lastModifiedAt = now.toISOString();
    metadatas.lastModifiedBy = this.username;
    var wrappedKey = this.keys[hashedTitle].key;
    var result = {};
    return this.unwrapKey(wrappedKey).then(function (key) {
      return _this8.encryptSecret(metadatas, secret, key);
    }).then(function (secretObject) {
      result.secret = secretObject.secret;
      result.iv = secretObject.iv;
      result.metadatas = secretObject.metadatas;
      result.iv_meta = secretObject.iv_meta;
      return result;
    });
  };

  User.prototype.createSecret = function createSecret(metadatas, secret) {
    var _this9 = this;

    var now = Date.now();
    var saltedTitle = now + '|' + metadatas.title;
    var result = {};
    var newMetadas = metadatas;
    return getSHA256(saltedTitle).then(function (hashedTitle) {
      result.hashedTitle = bytesToHexString(hashedTitle);
      newMetadas.id = result.hashedTitle;
      return _this9.encryptSecret(newMetadas, secret);
    }).then(function (secretObject) {
      result.secret = secretObject.secret;
      result.iv = secretObject.iv;
      result.metadatas = secretObject.metadatas;
      result.iv_meta = secretObject.iv_meta;
      result.hashedUsername = secretObject.hashedUsername;
      return _this9.wrapKey(secretObject.key, _this9.publicKey);
    }).then(function (wrappedKey) {
      result.wrappedKey = wrappedKey;
      return result;
    });
  };

  User.prototype.encryptSecret = function encryptSecret(metadatas, secret, key) {
    var _this10 = this;

    var result = {};
    return encryptAESGCM256(secret, key).then(function (secretObject) {
      result.secret = bytesToHexString(secretObject.secret);
      result.iv = bytesToHexString(secretObject.iv);
      result.key = secretObject.key;
      return encryptAESGCM256(metadatas, secretObject.key);
    }).then(function (secretObject) {
      result.metadatas = bytesToHexString(secretObject.secret);
      result.iv_meta = bytesToHexString(secretObject.iv);
      return getSHA256(_this10.username);
    }).then(function (hashedUsername) {
      result.hashedUsername = bytesToHexString(hashedUsername);
      return result;
    });
  };

  User.prototype.decryptSecret = function decryptSecret(hashedTitle, secret) {
    if (typeof this.keys[hashedTitle] === 'undefined') {
      return Promise.reject('You don\'t have this secret');
    }
    var wrappedKey = this.keys[hashedTitle].key;
    return this.unwrapKey(wrappedKey).then(function (key) {
      return decryptAESGCM256(secret, key);
    }).then(function (decryptedSecret) {
      return bytesToASCIIString(decryptedSecret);
    });
  };

  User.prototype.unwrapKey = function unwrapKey(wrappedKey) {
    return unwrapRSAOAEP(wrappedKey, this.privateKey);
  };

  User.prototype.wrapKey = function wrapKey(key, publicKey) {
    return wrapRSAOAEP(key, publicKey).then(function (wrappedKey) {
      return bytesToHexString(wrappedKey);
    });
  };

  User.prototype.decryptAllMetadatas = function decryptAllMetadatas(allMetadatas) {
    var _this11 = this;

    var decryptMetadatasPromises = [];
    var hashedTitles = Object.keys(this.keys);

    this.metadatas = {};
    hashedTitles.forEach(function (hashedTitle) {
      decryptMetadatasPromises.push(_this11.decryptSecret(hashedTitle, allMetadatas[hashedTitle]).then(function (metadatas) {
        _this11.metadatas[hashedTitle] = JSON.parse(metadatas);
      }));
    });

    return Promise.all(decryptMetadatasPromises);
  };

  User.prototype.activateShortLogin = function activateShortLogin(shortpass, deviceName) {
    var _this12 = this;

    var protectKey = void 0;
    var toSend = {};
    return generateWrappingKey().then(function (key) {
      protectKey = key;
      return exportKey(protectKey, _this12.privateKey);
    }).then(function (object) {
      localStorage.setItem(Secretin.prefix + 'privateKey', bytesToHexString(object.key));
      localStorage.setItem(Secretin.prefix + 'privateKeyIv', bytesToHexString(object.iv));
      return derivePassword(shortpass);
    }).then(function (derived) {
      toSend.salt = bytesToHexString(derived.salt);
      toSend.iterations = derived.iterations;
      toSend.hash = bytesToHexString(derived.hash);
      return exportKey(derived.key, protectKey);
    }).then(function (keyObject) {
      toSend.protectKey = bytesToHexString(keyObject.key);
      localStorage.setItem(Secretin.prefix + 'iv', bytesToHexString(keyObject.iv));
      localStorage.setItem(Secretin.prefix + 'username', _this12.username);
      return getSHA256(deviceName);
    }).then(function (deviceId) {
      toSend.deviceId = bytesToHexString(deviceId);
      localStorage.setItem(Secretin.prefix + 'deviceName', deviceName);
      return toSend;
    });
  };

  User.prototype.shortLogin = function shortLogin(shortpass, wrappedProtectKey) {
    var _this13 = this;

    var keyObject = {
      key: wrappedProtectKey,
      iv: localStorage.getItem(Secretin.prefix + 'iv')
    };
    return importKey(shortpass, keyObject).then(function (protectKey) {
      var privateKeyObject = {
        privateKey: localStorage.getItem(Secretin.prefix + 'privateKey'),
        iv: localStorage.getItem(Secretin.prefix + 'privateKeyIv')
      };
      return _this13.importPrivateKey(protectKey, privateKeyObject);
    });
  };

  return User;
}();

Object.defineProperty(User, 'defaultOptions', {
  value: {
    timeToClose: 30
  },
  writable: false,
  enumerable: true,
  configurable: false
});

var Secretin = function () {
  function Secretin() {
    var API$$ = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : API;
    var db = arguments[1];
    classCallCheck(this, Secretin);

    this.api = new API$$(db);
    this.currentUser = {};
  }

  Secretin.prototype.changeDB = function changeDB(db) {
    if (typeof this.currentUser.username !== 'undefined') {
      this.currentUser.disconnect();
    }
    this.currentUser = {};
    this.api = new this.api.constructor(db);
  };

  Secretin.prototype.newUser = function newUser(username, password) {
    var _this = this;

    var privateKey = void 0;
    var pass = void 0;
    var options = void 0;
    this.currentUser = new User(username);
    return this.api.userExists(username).then(function (exists) {
      return new Promise(function (resolve, reject) {
        if (!exists) {
          resolve(_this.currentUser.generateMasterKey());
        } else {
          reject(new UsernameAlreadyExistsError());
        }
      });
    }).then(function () {
      return _this.currentUser.exportPrivateKey(password);
    }).then(function (objectPrivateKey) {
      privateKey = objectPrivateKey.privateKey;
      pass = objectPrivateKey.pass;
      pass.totp = false;
      pass.shortpass = false;

      return _this.currentUser.exportOptions();
    }).then(function (rOptions) {
      options = rOptions;
      return _this.currentUser.exportPublicKey();
    }).then(function (publicKey) {
      return _this.api.addUser(_this.currentUser.username, privateKey, publicKey, pass, options);
    }).then(function () {
      return _this.currentUser;
    }).catch(function (err) {
      var wrapper = new WrappingError(err);
      throw wrapper.error;
    });
  };

  Secretin.prototype.loginUser = function loginUser(username, password, otp) {
    var _this2 = this;

    var key = void 0;
    var hash = void 0;
    var remoteUser = void 0;
    var parameters = void 0;
    return this.api.getDerivationParameters(username).then(function (rParameters) {
      parameters = rParameters;
      if (parameters.totp && (typeof otp === 'undefined' || otp === '')) {
        throw new NeedTOTPTokenError();
      }
      return derivePassword(password, parameters);
    }).then(function (dKey) {
      hash = bytesToHexString(dKey.hash);
      key = dKey.key;
      return _this2.api.getUser(username, hash, otp);
    }).then(function (user) {
      _this2.currentUser = new User(username);
      _this2.currentUser.totp = parameters.totp;
      _this2.currentUser.hash = hash;
      remoteUser = user;
      _this2.currentUser.keys = remoteUser.keys;
      return _this2.currentUser.importPublicKey(remoteUser.publicKey);
    }).then(function () {
      return _this2.currentUser.importPrivateKey(key, remoteUser.privateKey);
    }).then(function () {
      return _this2.currentUser.decryptAllMetadatas(remoteUser.metadatas);
    }).then(function () {
      return _this2.currentUser.importOptions(remoteUser.options);
    }).then(function () {
      return _this2.currentUser;
    }).catch(function (err) {
      var wrapper = new WrappingError(err);
      throw wrapper.error;
    });
  };

  Secretin.prototype.refreshUser = function refreshUser() {
    var _this3 = this;

    return this.api.getUserWithSignature(this.currentUser).then(function (user) {
      _this3.currentUser.keys = user.keys;
      return _this3.currentUser.decryptAllMetadatas(user.metadatas);
    }).catch(function (err) {
      var wrapper = new WrappingError(err);
      throw wrapper.error;
    });
  };

  Secretin.prototype.addFolder = function addFolder(title) {
    return this.addSecret(title, {}, 'folder');
  };

  Secretin.prototype.addSecret = function addSecret(clearTitle, content) {
    var _this4 = this;

    var type = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'secret';

    var hashedTitle = void 0;
    var now = new Date();
    var metadatas = {
      lastModifiedAt: now.toISOString(),
      lastModifiedBy: this.currentUser.username,
      users: {},
      title: clearTitle,
      type: type
    };

    return new Promise(function (resolve, reject) {
      metadatas.users[_this4.currentUser.username] = {
        username: _this4.currentUser.username,
        rights: 2,
        folders: {
          ROOT: true
        }
      };
      if (typeof _this4.currentUser.username === 'string') {
        _this4.currentUser.createSecret(metadatas, content).then(function (secretObject) {
          hashedTitle = secretObject.hashedTitle;
          _this4.currentUser.keys[secretObject.hashedTitle] = {
            key: secretObject.wrappedKey,
            rights: metadatas.users[_this4.currentUser.username].rights
          };
          _this4.currentUser.metadatas[secretObject.hashedTitle] = metadatas;
          return _this4.api.addSecret(_this4.currentUser, secretObject);
        }).then(function () {
          if (typeof _this4.currentUser.currentFolder !== 'undefined') {
            resolve(_this4.addSecretToFolder(hashedTitle, _this4.currentUser.currentFolder));
          } else {
            resolve(hashedTitle);
          }
        }).catch(function (err) {
          var wrapper = new WrappingError(err);
          throw wrapper.error;
        });
      } else {
        reject(new DisconnectedError());
      }
    });
  };

  Secretin.prototype.changePassword = function changePassword(password) {
    var _this5 = this;

    return this.currentUser.exportPrivateKey(password).then(function (objectPrivateKey) {
      return _this5.api.editUser(_this5.currentUser, objectPrivateKey, 'password');
    }).catch(function (err) {
      var wrapper = new WrappingError(err);
      throw wrapper.error;
    });
  };

  Secretin.prototype.editSecret = function editSecret(hashedTitle, content) {
    var _this6 = this;

    return this.currentUser.editSecret(hashedTitle, content).then(function (secretObject) {
      return _this6.api.editSecret(_this6.currentUser, secretObject, hashedTitle);
    }).catch(function (err) {
      var wrapper = new WrappingError(err);
      throw wrapper.error;
    });
  };

  Secretin.prototype.editOption = function editOption(name, value) {
    this.currentUser.options[name] = value;
    return this.resetOptions();
  };

  Secretin.prototype.editOptions = function editOptions(options) {
    this.currentUser.options = options;
    return this.resetOptions();
  };

  Secretin.prototype.resetOptions = function resetOptions() {
    var _this7 = this;

    return this.currentUser.exportOptions().then(function (encryptedOptions) {
      return _this7.api.editUser(_this7.currentUser, encryptedOptions, 'options');
    }).catch(function (err) {
      var wrapper = new WrappingError(err);
      return wrapper.error;
    });
  };

  Secretin.prototype.addSecretToFolder = function addSecretToFolder(hashedSecretTitle, hashedFolder) {
    var _this8 = this;

    var sharedSecretObjectsPromises = [];
    var folderMetadatas = this.currentUser.metadatas[hashedFolder];
    var secretMetadatas = this.currentUser.metadatas[hashedSecretTitle];
    Object.keys(folderMetadatas.users).forEach(function (friendName) {
      sharedSecretObjectsPromises = sharedSecretObjectsPromises.concat(function () {
        var friend = new User(friendName);
        return _this8.api.getPublicKey(friend.username).then(function (publicKey) {
          return friend.importPublicKey(publicKey);
        }).then(function () {
          return _this8.getSharedSecretObjects(hashedSecretTitle, friend, folderMetadatas.users[friend.username].rights, []);
        });
      }());
    });

    var metadatasUsers = {};
    var currentFolder = this.currentUser.currentFolder;
    var commonParentToClean = [];
    return Promise.all(sharedSecretObjectsPromises).then(function (sharedSecretObjectsArray) {
      var fullSharedSecretObjects = [];
      sharedSecretObjectsArray.forEach(function (sharedSecretObjects) {
        sharedSecretObjects.forEach(function (sharedSecretObject) {
          var newSharedSecretObject = sharedSecretObject;
          if (typeof metadatasUsers[newSharedSecretObject.hashedTitle] === 'undefined') {
            metadatasUsers[newSharedSecretObject.hashedTitle] = [];
          }
          metadatasUsers[newSharedSecretObject.hashedTitle].push({
            friendName: newSharedSecretObject.username,
            folder: newSharedSecretObject.inFolder
          });
          delete newSharedSecretObject.inFolder;
          if (_this8.currentUser.username !== newSharedSecretObject.username) {
            delete newSharedSecretObject.username;
            fullSharedSecretObjects.push(newSharedSecretObject);
          }
        });
      });
      return _this8.api.shareSecret(_this8.currentUser, fullSharedSecretObjects);
    }).then(function () {
      var resetMetaPromises = [];
      Object.keys(folderMetadatas.users).forEach(function (username) {
        Object.keys(folderMetadatas.users[username].folders).forEach(function (parentFolder) {
          if (typeof secretMetadatas.users[username].folders[parentFolder] !== 'undefined') {
            commonParentToClean.push(parentFolder);
          }
        });
      });

      Object.keys(metadatasUsers).forEach(function (hashedTitle) {
        metadatasUsers[hashedTitle].forEach(function (infos) {
          var currentSecret = _this8.currentUser.metadatas[hashedTitle];
          var metaUser = {
            username: infos.friendName,
            rights: folderMetadatas.users[infos.friendName].rights
          };

          if (typeof currentSecret.users[infos.friendName] !== 'undefined') {
            metaUser.folders = currentSecret.users[infos.friendName].folders;
          } else {
            metaUser.folders = {};
          }

          if (typeof infos.folder !== 'undefined') {
            var parentMetadatas = _this8.currentUser.metadatas[infos.folder];
            metaUser.folders[infos.folder] = {
              name: parentMetadatas.title
            };
          } else {
            metaUser.folders[hashedFolder] = {
              name: folderMetadatas.title
            };
          }

          commonParentToClean.forEach(function (parentFolder) {
            delete metaUser.folders[parentFolder];
          });

          if (infos.friendName === _this8.currentUser.username) {
            if (typeof currentFolder === 'undefined') {
              metaUser.rights = 2;
            } else {
              metaUser.rights = _this8.currentUser.keys[currentFolder].rights;
            }
          }
          _this8.currentUser.metadatas[hashedTitle].users[infos.friendName] = metaUser;
        });

        resetMetaPromises.push(_this8.resetMetadatas(hashedTitle));
      });
      return Promise.all(resetMetaPromises);
    }).then(function () {
      return _this8.api.getSecret(hashedFolder, _this8.currentUser);
    }).then(function (encryptedSecret) {
      return _this8.currentUser.decryptSecret(hashedFolder, encryptedSecret);
    }).then(function (secret) {
      var folders = JSON.parse(secret);
      folders[hashedSecretTitle] = 1;
      return _this8.editSecret(hashedFolder, folders);
    }).then(function () {
      var parentCleaningPromises = [];
      commonParentToClean.forEach(function (parentFolder) {
        if (parentFolder !== 'ROOT') {
          parentCleaningPromises.push(_this8.api.getSecret(parentFolder, _this8.currentUser).then(function (encryptedSecret) {
            return _this8.currentUser.decryptSecret(parentFolder, encryptedSecret);
          }).then(function (secret) {
            var folders = JSON.parse(secret);
            delete folders[hashedSecretTitle];
            return _this8.editSecret(parentFolder, folders);
          }));
        }
      });
      return Promise.all(parentCleaningPromises);
    }).then(function () {
      return hashedSecretTitle;
    }).catch(function (err) {
      var wrapper = new WrappingError(err);
      throw wrapper.error;
    });
  };

  Secretin.prototype.getSharedSecretObjects = function getSharedSecretObjects(hashedTitle, friend, rights, fullSharedSecretObjects, hashedFolder) {
    var _this9 = this;

    var isFolder = Promise.resolve();
    var sharedSecretObjectPromises = [];
    var secretMetadatas = this.currentUser.metadatas[hashedTitle];
    if (typeof secretMetadatas === 'undefined') {
      throw new DontHaveSecretError();
    } else {
      if (secretMetadatas.type === 'folder') {
        isFolder = isFolder.then(function () {
          return _this9.api.getSecret(hashedTitle, _this9.currentUser);
        }).then(function (encryptedSecret) {
          return _this9.currentUser.decryptSecret(hashedTitle, encryptedSecret);
        }).then(function (secrets) {
          Object.keys(JSON.parse(secrets)).forEach(function (hash) {
            sharedSecretObjectPromises.push(_this9.getSharedSecretObjects(hash, friend, rights, fullSharedSecretObjects, hashedTitle));
          });
          return Promise.all(sharedSecretObjectPromises);
        });
      }

      return isFolder.then(function () {
        return _this9.currentUser.shareSecret(friend, _this9.currentUser.keys[hashedTitle].key, hashedTitle);
      }).then(function (secretObject) {
        var newSecretObject = secretObject;
        newSecretObject.rights = rights;
        newSecretObject.inFolder = hashedFolder;
        newSecretObject.username = friend.username;
        fullSharedSecretObjects.push(newSecretObject);
        return fullSharedSecretObjects;
      }).catch(function (err) {
        var wrapper = new WrappingError(err);
        throw wrapper.error;
      });
    }
  };

  Secretin.prototype.resetMetadatas = function resetMetadatas(hashedTitle) {
    var _this10 = this;

    var secretMetadatas = this.currentUser.metadatas[hashedTitle];
    var now = new Date();
    secretMetadatas.lastModifiedAt = now;
    secretMetadatas.lastModifiedBy = this.currentUser.username;
    return this.getSecret(hashedTitle).then(function (secret) {
      return _this10.editSecret(hashedTitle, secret);
    }).catch(function (err) {
      var wrapper = new WrappingError(err);
      throw wrapper.error;
    });
  };

  // this one should disappear


  Secretin.prototype.shareFolder = function shareFolder(hashedTitle, folderName) {
    var _this11 = this;

    return new Promise(function (resolve, reject) {
      var hashedFolder = false;
      Object.keys(_this11.currentUser.metadatas).forEach(function (hash) {
        var secretMetadatas = _this11.currentUser.metadatas[hash];
        if (secretMetadatas.type === 'folder' && secretMetadatas.title === folderName) {
          hashedFolder = hash;
        }
      });
      if (hashedFolder === false) {
        reject(new FolderNotFoundError());
      } else if (hashedTitle === hashedFolder) {
        reject(new FolderInItselfError());
      } else {
        resolve(_this11.addSecretToFolder(hashedTitle, hashedFolder));
      }
    });
  };
  //

  Secretin.prototype.shareSecret = function shareSecret(hashedTitle, friendName, rights) {
    var _this12 = this;

    var sharedSecretObjects = void 0;
    var friend = new User(friendName);
    return this.api.getPublicKey(friend.username).then(function (publicKey) {
      return friend.importPublicKey(publicKey);
    }, function () {
      return Promise.reject('Friend not found');
    }).then(function () {
      return _this12.getSharedSecretObjects(hashedTitle, friend, rights, []);
    }).then(function (rSharedSecretObjects) {
      sharedSecretObjects = rSharedSecretObjects;
      return _this12.api.shareSecret(_this12.currentUser, sharedSecretObjects);
    }).then(function () {
      var resetMetaPromises = [];
      sharedSecretObjects.forEach(function (sharedSecretObject) {
        var secretMetadatas = _this12.currentUser.metadatas[sharedSecretObject.hashedTitle];
        secretMetadatas.users[friend.username] = {
          username: friend.username,
          rights: rights,
          folders: {}
        };
        if (typeof sharedSecretObject.inFolder !== 'undefined') {
          var parentMetadatas = _this12.currentUser.metadatas[sharedSecretObject.inFolder];
          secretMetadatas.users[friend.username].folders[sharedSecretObject.inFolder] = {
            name: parentMetadatas.title
          };
        } else {
          secretMetadatas.users[friend.username].folders.ROOT = true;
        }
        resetMetaPromises.push(_this12.resetMetadatas(sharedSecretObject.hashedTitle));
      });
      return Promise.all(resetMetaPromises);
    }).then(function () {
      return _this12.currentUser.metadatas[hashedTitle];
    }).catch(function (err) {
      var wrapper = new WrappingError(err);
      throw wrapper.error;
    });
  };

  Secretin.prototype.unshareSecret = function unshareSecret(hashedTitle, friendName) {
    var _this13 = this;

    var isFolder = Promise.resolve();
    var secretMetadatas = this.currentUser.metadatas[hashedTitle];
    if (typeof secretMetadatas === 'undefined') {
      return Promise.reject(new DontHaveSecretError());
    }
    if (secretMetadatas.type === 'folder') {
      isFolder = isFolder.then(function () {
        return _this13.unshareFolderSecrets(hashedTitle, friendName);
      });
    }

    return isFolder.then(function () {
      return _this13.api.unshareSecret(_this13.currentUser, [friendName], hashedTitle);
    }).then(function (result) {
      if (result !== 'Secret unshared') {
        var wrapper = new WrappingError(result);
        throw wrapper.error;
      }
      delete secretMetadatas.users[friendName];
      return _this13.resetMetadatas(hashedTitle);
    }).then(function () {
      return _this13.renewKey(hashedTitle);
    }).then(function () {
      return _this13.currentUser.metadatas[hashedTitle];
    }).catch(function (err) {
      var wrapper = new WrappingError(err);
      throw wrapper.error;
    });
  };

  Secretin.prototype.unshareFolderSecrets = function unshareFolderSecrets(hashedFolder, friendName) {
    var _this14 = this;

    return this.api.getSecret(hashedFolder, this.currentUser).then(function (encryptedSecret) {
      return _this14.currentUser.decryptSecret(hashedFolder, encryptedSecret);
    }).then(function (secrets) {
      return Object.keys(JSON.parse(secrets)).reduce(function (promise, hashedTitle) {
        return promise.then(function () {
          return _this14.unshareSecret(hashedTitle, friendName);
        });
      }, Promise.resolve());
    }).catch(function (err) {
      var wrapper = new WrappingError(err);
      throw wrapper.error;
    });
  };

  Secretin.prototype.wrapKeyForFriend = function wrapKeyForFriend(hashedUsername, key) {
    var _this15 = this;

    var friend = void 0;
    return this.api.getPublicKey(hashedUsername, true).then(function (publicKey) {
      friend = new User(hashedUsername);
      return friend.importPublicKey(publicKey);
    }).then(function () {
      return _this15.currentUser.wrapKey(key, friend.publicKey);
    }).then(function (friendWrappedKey) {
      return { user: hashedUsername, key: friendWrappedKey };
    }).catch(function (err) {
      var wrapper = new WrappingError(err);
      throw wrapper.error;
    });
  };

  Secretin.prototype.renewKey = function renewKey(hashedTitle) {
    var _this16 = this;

    var encryptedSecret = void 0;
    var secret = {};
    var hashedCurrentUsername = void 0;
    var wrappedKeys = void 0;
    return this.api.getSecret(hashedTitle, this.currentUser).then(function (eSecret) {
      encryptedSecret = eSecret;
      return _this16.currentUser.decryptSecret(hashedTitle, encryptedSecret);
    }).then(function (rawSecret) {
      return _this16.currentUser.encryptSecret(_this16.currentUser.metadatas[hashedTitle], JSON.parse(rawSecret));
    }).then(function (secretObject) {
      secret.secret = secretObject.secret;
      secret.iv = secretObject.iv;
      secret.metadatas = secretObject.metadatas;
      secret.iv_meta = secretObject.iv_meta;
      hashedCurrentUsername = secretObject.hashedUsername;
      var wrappedKeysPromises = [];
      encryptedSecret.users.forEach(function (hashedUsername) {
        if (hashedCurrentUsername === hashedUsername) {
          wrappedKeysPromises.push(_this16.currentUser.wrapKey(secretObject.key, _this16.currentUser.publicKey).then(function (wrappedKey) {
            return { user: hashedCurrentUsername, key: wrappedKey };
          }));
        } else {
          wrappedKeysPromises.push(_this16.wrapKeyForFriend(hashedUsername, secretObject.key));
        }
      });

      return Promise.all(wrappedKeysPromises);
    }).then(function (rWrappedKeys) {
      wrappedKeys = rWrappedKeys;
      return _this16.api.newKey(_this16.currentUser, hashedTitle, secret, wrappedKeys);
    }).then(function () {
      wrappedKeys.forEach(function (wrappedKey) {
        if (wrappedKey.user === hashedCurrentUsername) {
          _this16.currentUser.keys[hashedTitle].key = wrappedKey.key;
        }
      });
    }).catch(function (err) {
      var wrapper = new WrappingError(err);
      throw wrapper.error;
    });
  };

  Secretin.prototype.removeSecretFromFolder = function removeSecretFromFolder(hashedTitle, hashedFolder) {
    var _this17 = this;

    var secretMetadatas = this.currentUser.metadatas[hashedTitle];
    var usersToDelete = [];
    Object.keys(secretMetadatas.users).forEach(function (username) {
      if (typeof secretMetadatas.users[username].folders[hashedFolder] !== 'undefined') {
        usersToDelete.push(username);
      }
    });
    return this.api.unshareSecret(this.currentUser, usersToDelete, hashedTitle).then(function () {
      usersToDelete.forEach(function (username) {
        delete secretMetadatas.users[username].folders[hashedFolder];
        if (Object.keys(secretMetadatas.users[username].folders).length === 0) {
          if (_this17.currentUser.username === username) {
            secretMetadatas.users[username].folders.ROOT = true;
          } else {
            delete secretMetadatas.users[username];
          }
        }
      });
      return _this17.renewKey(hashedTitle);
    }).then(function () {
      return _this17.resetMetadatas(hashedTitle);
    }).then(function () {
      return _this17.api.getSecret(hashedFolder, _this17.currentUser);
    }).then(function (encryptedSecret) {
      return _this17.currentUser.decryptSecret(hashedFolder, encryptedSecret);
    }).then(function (secret) {
      var folder = JSON.parse(secret);
      delete folder[hashedTitle];
      return _this17.editSecret(hashedFolder, folder);
    }).catch(function (err) {
      var wrapper = new WrappingError(err);
      throw wrapper.error;
    });
  };

  Secretin.prototype.getSecret = function getSecret(hashedTitle) {
    var _this18 = this;

    return this.api.getSecret(hashedTitle, this.currentUser).then(function (encryptedSecret) {
      return _this18.currentUser.decryptSecret(hashedTitle, encryptedSecret);
    }).then(function (secret) {
      return JSON.parse(secret);
    }).catch(function (err) {
      var wrapper = new WrappingError(err);
      throw wrapper.error;
    });
  };

  Secretin.prototype.deleteSecret = function deleteSecret(hashedTitle) {
    var _this19 = this;

    var list = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

    var isFolder = Promise.resolve();
    var secretMetadatas = this.currentUser.metadatas[hashedTitle];
    if (typeof secretMetadatas === 'undefined') {
      return Promise.reject(new DontHaveSecretError());
    }
    if (secretMetadatas.type === 'folder' && list.indexOf(hashedTitle) === -1) {
      isFolder = isFolder.then(function () {
        return _this19.deleteFolderSecrets(hashedTitle, list);
      });
    }

    return isFolder.then(function () {
      return _this19.api.deleteSecret(_this19.currentUser, hashedTitle);
    }).then(function () {
      delete _this19.currentUser.metadatas[hashedTitle];
      delete _this19.currentUser.keys[hashedTitle];
      var editFolderPromises = [];
      var currentUsername = _this19.currentUser.username;
      Object.keys(secretMetadatas.users[currentUsername].folders).forEach(function (hashedFolder) {
        if (hashedFolder !== 'ROOT') {
          editFolderPromises.push(_this19.api.getSecret(hashedFolder, _this19.currentUser).then(function (encryptedSecret) {
            return _this19.currentUser.decryptSecret(hashedFolder, encryptedSecret);
          }).then(function (secret) {
            var folder = JSON.parse(secret);
            delete folder[hashedTitle];
            return _this19.editSecret(hashedFolder, folder);
          }));
        }
      });
      return Promise.all(editFolderPromises);
    }).catch(function (err) {
      var wrapper = new WrappingError(err);
      throw wrapper.error;
    });
  };

  Secretin.prototype.deleteFolderSecrets = function deleteFolderSecrets(hashedFolder, list) {
    var _this20 = this;

    list.push(hashedFolder);
    return this.api.getSecret(hashedFolder, this.currentUser).then(function (encryptedSecret) {
      return _this20.currentUser.decryptSecret(hashedFolder, encryptedSecret);
    }).then(function (secrets) {
      return Object.keys(JSON.parse(secrets)).reduce(function (promise, hashedTitle) {
        return promise.then(function () {
          return _this20.deleteSecret(hashedTitle, list);
        });
      }, Promise.resolve());
    }).catch(function (err) {
      var wrapper = new WrappingError(err);
      throw wrapper.error;
    });
  };

  Secretin.prototype.deactivateTotp = function deactivateTotp() {
    return this.api.deactivateTotp(this.currentUser).catch(function (err) {
      var wrapper = new WrappingError(err);
      throw wrapper.error;
    });
  };

  Secretin.prototype.activateTotp = function activateTotp(seed) {
    var protectedSeed = xorSeed(hexStringToUint8Array(this.currentUser.hash), seed.raw);
    return this.api.activateTotp(bytesToHexString(protectedSeed), this.currentUser).catch(function (err) {
      var wrapper = new WrappingError(err);
      throw wrapper.error;
    });
  };

  Secretin.prototype.activateShortLogin = function activateShortLogin(shortpass, deviceName) {
    var _this21 = this;

    if (localStorageAvailable()) {
      return this.currentUser.activateShortLogin(shortpass, deviceName).then(function (toSend) {
        return _this21.api.activateShortLogin(toSend, _this21.currentUser);
      }).catch(function (err) {
        var wrapper = new WrappingError(err);
        throw wrapper.error;
      });
    }
    return Promise.reject(new LocalStorageUnavailableError());
  };

  Secretin.prototype.deactivateShortLogin = function deactivateShortLogin() {
    if (localStorageAvailable()) {
      localStorage.removeItem(Secretin.prefix + 'username');
      localStorage.removeItem(Secretin.prefix + 'deviceName');
      localStorage.removeItem(Secretin.prefix + 'privateKey');
      localStorage.removeItem(Secretin.prefix + 'privateKeyIv');
      localStorage.removeItem(Secretin.prefix + 'iv');
      return Promise.resolve();
    }
    return Promise.reject(new LocalStorageUnavailableError());
  };

  Secretin.prototype.shortLogin = function shortLogin(shortpass) {
    var _this22 = this;

    var username = localStorage.getItem(Secretin.prefix + 'username');
    var deviceName = localStorage.getItem(Secretin.prefix + 'deviceName');
    var shortpassKey = void 0;
    var parameters = void 0;
    this.currentUser = new User(username);
    return this.api.getProtectKeyParameters(username, deviceName).then(function (rParameters) {
      parameters = rParameters;
      _this22.currentUser.totp = parameters.totp;
      return _this22.currentUser.importPublicKey(parameters.publicKey);
    }).then(function () {
      return derivePassword(shortpass, parameters);
    }).then(function (dKey) {
      shortpassKey = dKey.key;
      return _this22.api.getProtectKey(username, deviceName, bytesToHexString(dKey.hash));
    }).then(function (protectKey) {
      return _this22.currentUser.shortLogin(shortpassKey, protectKey);
    }).then(function () {
      return _this22.refreshUser();
    }).then(function () {
      return _this22.currentUser;
    }).catch(function (err) {
      localStorage.removeItem(Secretin.prefix + 'username');
      localStorage.removeItem(Secretin.prefix + 'deviceName');
      localStorage.removeItem(Secretin.prefix + 'privateKey');
      localStorage.removeItem(Secretin.prefix + 'privateKeyIv');
      localStorage.removeItem(Secretin.prefix + 'iv');
      var wrapper = new WrappingError(err);
      throw wrapper.error;
    });
  };

  Secretin.prototype.canITryShortLogin = function canITryShortLogin() {
    return localStorageAvailable() && localStorage.getItem(Secretin.prefix + 'username') !== null;
  };

  Secretin.prototype.getSavedUsername = function getSavedUsername() {
    if (this.canITryShortLogin()) {
      return localStorage.getItem(Secretin.prefix + 'username');
    }
    return null;
  };

  return Secretin;
}();

Object.defineProperty(Secretin, 'prefix', {
  value: 'Secret-in:',
  writable: false,
  enumerable: true,
  configurable: false
});

function reqData(path, datas, type) {
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open(type, encodeURI(path));
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function () {
      var newData = JSON.parse(xhr.responseText);
      if (xhr.status === 200) {
        resolve(newData.reason);
      } else {
        reject(newData.reason);
      }
    };
    xhr.send(JSON.stringify(datas));
  });
}

function doGET(path) {
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', encodeURI(path));
    xhr.onload = function () {
      var datas = JSON.parse(xhr.responseText);
      if (xhr.status === 200) {
        resolve(datas);
      } else {
        reject(datas.reason);
      }
    };
    xhr.send();
  });
}

function doPOST(path, datas) {
  return reqData(path, datas, 'POST');
}

function doPUT(path, datas) {
  return reqData(path, datas, 'PUT');
}

function doDELETE(path, datas) {
  return reqData(path, datas, 'DELETE');
}

var API$1 = function () {
  function API(link) {
    classCallCheck(this, API);

    if (link) {
      this.db = link;
    } else {
      this.db = window.location.origin;
    }
  }

  API.prototype.userExists = function userExists(username, isHashed) {
    return this.retrieveUser(username, 'undefined', isHashed).then(function () {
      return true;
    }, function () {
      return false;
    });
  };

  API.prototype.addUser = function addUser(username, privateKey, publicKey, pass, options) {
    var _this = this;

    return getSHA256(username).then(function (hashedUsername) {
      return doPOST(_this.db + '/user/' + bytesToHexString(hashedUsername), {
        pass: pass,
        privateKey: privateKey,
        publicKey: publicKey,
        keys: {},
        options: options
      });
    });
  };

  API.prototype.addSecret = function addSecret(user, secretObject) {
    var _this2 = this;

    var json = JSON.stringify({
      secret: secretObject.secret,
      iv: secretObject.iv,
      metadatas: secretObject.metadatas,
      iv_meta: secretObject.iv_meta,
      key: secretObject.wrappedKey,
      title: secretObject.hashedTitle
    });
    return user.sign(json).then(function (signature) {
      return doPOST(_this2.db + '/secret/' + secretObject.hashedUsername, {
        json: json,
        sig: bytesToHexString(signature)
      });
    });
  };

  API.prototype.deleteSecret = function deleteSecret(user, hashedTitle) {
    var _this3 = this;

    var hashedUsername = void 0;
    var url = void 0;
    return getSHA256(user.username).then(function (rHashedUsername) {
      hashedUsername = bytesToHexString(rHashedUsername);
      url = '/secret/' + hashedUsername + '/' + hashedTitle;
      return user.sign('DELETE ' + url);
    }).then(function (signature) {
      return doDELETE('' + _this3.db + url, {
        sig: bytesToHexString(signature)
      });
    });
  };

  API.prototype.editSecret = function editSecret(user, secretObject, hashedTitle) {
    var _this4 = this;

    var hashedUsername = void 0;
    var json = JSON.stringify({
      iv: secretObject.iv,
      secret: secretObject.secret,
      iv_meta: secretObject.iv_meta,
      metadatas: secretObject.metadatas,
      title: hashedTitle
    });
    return getSHA256(user.username).then(function (rHashedUsername) {
      hashedUsername = bytesToHexString(rHashedUsername);
      return user.sign(json);
    }).then(function (signature) {
      return doPUT(_this4.db + '/secret/' + hashedUsername, {
        json: json,
        sig: bytesToHexString(signature)
      });
    });
  };

  API.prototype.newKey = function newKey(user, hashedTitle, secret, wrappedKeys) {
    var _this5 = this;

    var hashedUsername = void 0;
    var json = JSON.stringify({
      wrappedKeys: wrappedKeys,
      secret: secret,
      title: hashedTitle
    });
    return getSHA256(user.username).then(function (rHashedUsername) {
      hashedUsername = bytesToHexString(rHashedUsername);
      return user.sign(json);
    }).then(function (signature) {
      return doPOST(_this5.db + '/newKey/' + hashedUsername, {
        json: json,
        sig: bytesToHexString(signature)
      });
    });
  };

  API.prototype.unshareSecret = function unshareSecret(user, friendNames, hashedTitle) {
    var _this6 = this;

    var hashedUsername = void 0;
    var hashedFriendUsernames = [];
    var datas = {
      title: hashedTitle
    };
    var json = void 0;
    return getSHA256(user.username).then(function (rHashedUsername) {
      hashedUsername = bytesToHexString(rHashedUsername);
      var hashedFriendUseramePromises = [];
      friendNames.forEach(function (username) {
        hashedFriendUseramePromises.push(getSHA256(username));
      });
      return Promise.all(hashedFriendUseramePromises);
    }).then(function (rHashedFriendUserames) {
      rHashedFriendUserames.forEach(function (hashedFriendUserame) {
        hashedFriendUsernames.push(bytesToHexString(hashedFriendUserame));
      });
      datas.friendNames = hashedFriendUsernames;
      json = JSON.stringify(datas);
      return user.sign(json);
    }).then(function (signature) {
      return doPOST(_this6.db + '/unshare/' + hashedUsername, {
        json: json,
        sig: bytesToHexString(signature)
      });
    });
  };

  API.prototype.shareSecret = function shareSecret(user, sharedSecretObjects) {
    var _this7 = this;

    var hashedUsername = void 0;
    var json = JSON.stringify({
      secretObjects: sharedSecretObjects
    });
    return getSHA256(user.username).then(function (rHashedUsername) {
      hashedUsername = bytesToHexString(rHashedUsername);
      return user.sign(json);
    }).then(function (signature) {
      return doPOST(_this7.db + '/share/' + hashedUsername, {
        json: json,
        sig: bytesToHexString(signature)
      });
    });
  };

  API.prototype.retrieveUser = function retrieveUser(username, hash, hashed) {
    var _this8 = this;

    var isHashed = Promise.resolve();
    var hashedUsername = username;
    if (!hashed) {
      isHashed = isHashed.then(function () {
        return getSHA256(username);
      }).then(function (rHashedUsername) {
        hashedUsername = bytesToHexString(rHashedUsername);
      });
    }
    return isHashed.then(function () {
      return doGET(_this8.db + '/user/' + hashedUsername + '/' + hash);
    });
  };

  API.prototype.getDerivationParameters = function getDerivationParameters(username, isHashed) {
    return this.retrieveUser(username, 'undefined', isHashed).then(function (user) {
      return {
        totp: user.pass.totp,
        shortpass: user.pass.shortpass,
        salt: user.pass.salt,
        iterations: user.pass.iterations
      };
    });
  };

  API.prototype.getPublicKey = function getPublicKey(username, isHashed) {
    return this.retrieveUser(username, 'undefined', isHashed).then(function (user) {
      return user.publicKey;
    });
  };

  API.prototype.getUser = function getUser(username, hash, otp) {
    var _this9 = this;

    return getSHA256(username).then(function (hashedUsername) {
      return doGET(_this9.db + '/user/' + bytesToHexString(hashedUsername) + '/' + hash + '?otp=' + otp);
    });
  };

  API.prototype.getUserWithSignature = function getUserWithSignature(user) {
    var _this10 = this;

    var hashedUsername = void 0;
    var url = void 0;
    return getSHA256(user.username).then(function (rHashedUsername) {
      hashedUsername = bytesToHexString(rHashedUsername);
      url = '/user/' + hashedUsername;
      return user.sign(url);
    }).then(function (signature) {
      return doGET('' + _this10.db + url + '?sig=' + bytesToHexString(signature));
    });
  };

  API.prototype.getSecret = function getSecret(hashedTitle, user) {
    var _this11 = this;

    var hashedUsername = void 0;
    var url = void 0;
    return getSHA256(user.username).then(function (rHashedUsername) {
      hashedUsername = bytesToHexString(rHashedUsername);
      url = '/secret/' + hashedUsername + '/' + hashedTitle;
      return user.sign(url);
    }).then(function (signature) {
      return doGET('' + _this11.db + url + '?sig=' + bytesToHexString(signature));
    });
  };

  API.prototype.getProtectKey = function getProtectKey(username, deviceName, hash) {
    var _this12 = this;

    var hashedUsername = void 0;
    return getSHA256(username).then(function (rHashedUsername) {
      hashedUsername = bytesToHexString(rHashedUsername);
      return getSHA256(deviceName);
    }).then(function (deviceId) {
      return doGET(_this12.db + '/protectKey/' + hashedUsername + '/' + bytesToHexString(deviceId) + '/' + hash);
    }).then(function (result) {
      if (hash === 'undefined') {
        return result;
      }
      return result.protectKey;
    });
  };

  API.prototype.getProtectKeyParameters = function getProtectKeyParameters(username, deviceName) {
    return this.getProtectKey(username, deviceName, 'undefined');
  };

  API.prototype.getDb = function getDb(user) {
    var _this13 = this;

    var hashedUsername = void 0;
    var url = void 0;
    return getSHA256(user.username).then(function (rHashedUsername) {
      hashedUsername = bytesToHexString(rHashedUsername);
      url = '/database/' + hashedUsername;
      return user.sign(url);
    }).then(function (signature) {
      return doGET('' + _this13.db + url + '?sig=' + bytesToHexString(signature));
    });
  };

  API.prototype.editUser = function editUser(user, datas, type) {
    var _this14 = this;

    var hashedUsername = void 0;
    var json = JSON.stringify(datas);
    return getSHA256(user.username).then(function (rHashedUsername) {
      hashedUsername = bytesToHexString(rHashedUsername);
      return user.sign(json);
    }).then(function (signature) {
      return doPUT(_this14.db + '/user/' + hashedUsername + '?type=' + type, {
        json: json,
        sig: bytesToHexString(signature)
      });
    });
  };

  API.prototype.changePassword = function changePassword(user, privateKey, pass) {
    var _this15 = this;

    var hashedUsername = void 0;
    var json = JSON.stringify({
      pass: pass,
      privateKey: privateKey
    });
    return getSHA256(user.username).then(function (rHashedUsername) {
      hashedUsername = bytesToHexString(rHashedUsername);
      return user.sign(json);
    }).then(function (signature) {
      return doPUT(_this15.db + '/user/' + hashedUsername, {
        json: json,
        sig: bytesToHexString(signature)
      });
    });
  };

  API.prototype.testTotp = function testTotp(seed, token) {
    return doGET(this.db + '/totp/' + seed + '/' + token);
  };

  API.prototype.activateTotp = function activateTotp(seed, user) {
    var _this16 = this;

    var hashedUsername = void 0;
    var json = JSON.stringify({
      seed: seed
    });
    return getSHA256(user.username).then(function (rHashedUsername) {
      hashedUsername = bytesToHexString(rHashedUsername);
      return user.sign(json);
    }).then(function (signature) {
      return doPUT(_this16.db + '/activateTotp/' + hashedUsername, {
        json: json,
        sig: bytesToHexString(signature)
      });
    });
  };

  API.prototype.deactivateTotp = function deactivateTotp(user) {
    var _this17 = this;

    var hashedUsername = void 0;
    var url = void 0;
    return getSHA256(user.username).then(function (rHashedUsername) {
      hashedUsername = bytesToHexString(rHashedUsername);
      url = '/deactivateTotp/' + hashedUsername;
      return user.sign(url);
    }).then(function (signature) {
      return doPUT('' + _this17.db + url + '?sig=' + bytesToHexString(signature), {});
    });
  };

  API.prototype.activateShortLogin = function activateShortLogin(shortpass, user) {
    var _this18 = this;

    var hashedUsername = void 0;
    var json = JSON.stringify({
      shortpass: shortpass
    });
    return getSHA256(user.username).then(function (rHashedUsername) {
      hashedUsername = bytesToHexString(rHashedUsername);
      return user.sign(json);
    }).then(function (signature) {
      return doPUT(_this18.db + '/activateShortLogin/' + hashedUsername, {
        json: json,
        sig: bytesToHexString(signature)
      });
    });
  };

  return API;
}();

Secretin.version = version;
Secretin.User = User;
Secretin.API = {
  Standalone: API,
  Server: API$1
};

Secretin.Errors = Errors;
Secretin.Utils = Utils;

return Secretin;

})));