import { DecryptMetadataStatus } from './Statuses';

import { defaultProgress } from './lib/utils';

import Secretin from './Secretin';

class User {
  constructor(username, cryptoAdapter) {
    this.cryptoAdapter = cryptoAdapter;
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

  disconnect() {
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
  }

  sign(datas) {
    return this.cryptoAdapter.sign(datas, this.privateKeySign);
  }

  verify(datas, signature) {
    return this.cryptoAdapter.verify(datas, signature, this.publicKeySign);
  }

  generateMasterKey() {
    return this.cryptoAdapter
      .genRSAOAEP()
      .then(keyPair => {
        this.publicKey = keyPair.publicKey;
        this.privateKey = keyPair.privateKey;
        return this.cryptoAdapter.convertOAEPToPSS(this.privateKey, 'sign');
      })
      .then(privateKeySign => {
        this.privateKeySign = privateKeySign;
        return this.cryptoAdapter.convertOAEPToPSS(this.publicKey, 'verify');
      })
      .then(publicKeySign => {
        this.publicKeySign = publicKeySign;
      });
  }

  exportPublicKey() {
    return this.cryptoAdapter.exportClearKey(this.publicKey);
  }

  importPublicKey(jwkPublicKey) {
    return this.cryptoAdapter
      .importPublicKey(jwkPublicKey)
      .then(publicKey => {
        this.publicKey = publicKey;
        return this.cryptoAdapter.convertOAEPToPSS(this.publicKey, 'verify');
      })
      .then(publicKeySign => {
        this.publicKeySign = publicKeySign;
      });
  }

  exportPrivateKey(password) {
    const pass = {};
    return this.cryptoAdapter
      .derivePassword(password)
      .then(dKey => {
        pass.salt = dKey.salt;
        this.hash = dKey.hash;
        pass.hash = this.hash;
        pass.iterations = dKey.iterations;
        return this.cryptoAdapter.exportKey(dKey.key, this.privateKey);
      })
      .then(keyObject => ({
        privateKey: {
          privateKey: keyObject.key,
          iv: keyObject.iv,
        },
        pass,
      }));
  }

  importPrivateKey(dKey, privateKeyObject) {
    return this.cryptoAdapter
      .importPrivateKey(dKey, privateKeyObject)
      .then(privateKey => {
        this.privateKey = privateKey;
        return this.cryptoAdapter.convertOAEPToPSS(this.privateKey, 'sign');
      })
      .then(privateKeySign => {
        this.privateKeySign = privateKeySign;
      });
  }

  exportBigPrivateData(data) {
    const result = {};
    return this.cryptoAdapter
      .encryptAESGCM256(data)
      .then(secretObject => {
        result.secret = secretObject.secret;
        result.iv = secretObject.iv;
        return this.wrapKey(secretObject.key, this.publicKey);
      })
      .then(wrappedKey => {
        result.wrappedKey = wrappedKey;
        return result;
      });
  }

  importBigPrivateData(data) {
    return this.unwrapKey(data.wrappedKey).then(key =>
      this.cryptoAdapter.decryptAESGCM256(data, key)
    );
  }

  exportPrivateData(data) {
    const result = {};
    return this.cryptoAdapter
      .encryptRSAOAEP(data, this.publicKey)
      .then(encryptedOptions => {
        result.data = encryptedOptions;
        return this.sign(result.data);
      })
      .then(signature => {
        result.signature = signature;
        return result;
      });
  }

  importPrivateData(data, signature) {
    return this.verify(data, signature).then(verified => {
      if (verified) {
        return this.cryptoAdapter.decryptRSAOAEP(data, this.privateKey);
      }
      return null;
    });
  }

  exportOptions() {
    return this.exportPrivateData(this.options).then(result => ({
      options: result.data,
      signature: result.signature,
    }));
  }

  importOptions(optionsObject) {
    // Retro compatibility
    if (typeof optionsObject === 'undefined') {
      this.options = User.defaultOptions;
      return Promise.resolve(null);
    }
    return this.importPrivateData(
      optionsObject.options,
      optionsObject.signature
    ).then(options => {
      if (options) {
        this.options = options;
      } else {
        this.options = User.defaultOptions;
      }
    });
  }

  shareSecret(friend, wrappedKey, hashedTitle) {
    const result = { hashedTitle };
    return this.unwrapKey(wrappedKey)
      .then(key => this.wrapKey(key, friend.publicKey))
      .then(friendWrappedKey => {
        result.wrappedKey = friendWrappedKey;
        return this.cryptoAdapter.getSHA256(friend.username);
      })
      .then(hashedUsername => {
        result.friendName = hashedUsername;
        return result;
      });
  }

  editSecret(hashedTitle, secret, history) {
    const metadatas = this.metadatas[hashedTitle];
    if (typeof metadatas === 'undefined') {
      return Promise.reject("You don't have this secret");
    }
    const now = new Date();
    metadatas.lastModifiedAt = now.toISOString();
    metadatas.lastModifiedBy = this.username;
    const wrappedKey = this.keys[hashedTitle].key;
    const result = {};
    return this.unwrapKey(wrappedKey)
      .then(key => this.encryptSecret(metadatas, secret, history, key))
      .then(secretObject => {
        result.secret = secretObject.secret;
        result.iv = secretObject.iv;
        result.metadatas = secretObject.metadatas;
        result.iv_meta = secretObject.iv_meta;
        result.history = secretObject.history;
        result.iv_history = secretObject.iv_history;
        return result;
      });
  }

  createSecret(metadatas, secret) {
    const now = Date.now();
    const saltedTitle = `${now}|${metadatas.title}`;
    const result = {};
    const newMetadas = metadatas;
    return this.cryptoAdapter
      .getSHA256(saltedTitle)
      .then(hashedTitle => {
        result.hashedTitle = hashedTitle;
        newMetadas.id = result.hashedTitle;
        return this.encryptSecret(newMetadas, secret);
      })
      .then(secretObject => {
        result.secret = secretObject.secret;
        result.iv = secretObject.iv;
        result.metadatas = secretObject.metadatas;
        result.iv_meta = secretObject.iv_meta;
        result.history = secretObject.history;
        result.iv_history = secretObject.iv_history;
        result.hashedUsername = secretObject.hashedUsername;
        return this.wrapKey(secretObject.key, this.publicKey);
      })
      .then(wrappedKey => {
        result.wrappedKey = wrappedKey;
        return result;
      });
  }

  exportSecret(
    hashedTitle,
    encryptedSecret,
    encryptedMetadata,
    encryptedHistory
  ) {
    let secret;
    let metadata;
    return this.decryptSecret(hashedTitle, encryptedSecret)
      .then(rSecret => {
        secret = rSecret;
        return this.decryptSecret(hashedTitle, encryptedMetadata);
      })
      .then(rMetadata => {
        metadata = rMetadata;
        if (typeof encryptedHistory.iv === 'undefined') {
          return Promise.resolve({});
        }
        return this.decryptSecret(hashedTitle, encryptedHistory);
      })
      .then(history => ({
        secret,
        metadata,
        history,
      }));
  }

  importSecret(hashedTitle, secret, metadata, history) {
    const result = {};
    return this.encryptSecret(metadata, secret, history)
      .then(secretObject => {
        result.secret = secretObject.secret;
        result.iv = secretObject.iv;
        result.metadatas = secretObject.metadatas;
        result.iv_meta = secretObject.iv_meta;
        result.history = secretObject.history;
        result.iv_history = secretObject.iv_history;
        result.hashedUsername = secretObject.hashedUsername;
        result.hashedTitle = hashedTitle;
        return this.wrapKey(secretObject.key, this.publicKey);
      })
      .then(wrappedKey => {
        result.wrappedKey = wrappedKey;
        return result;
      });
  }

  encryptSecret(metadatas, secret, history, key) {
    const result = {};
    let newHistory;
    return Promise.resolve()
      .then(() => {
        if (Array.isArray(history)) {
          // history already decrypted
          return Promise.resolve(history);
        }
        if (
          typeof history !== 'undefined' &&
          typeof history.iv !== 'undefined' &&
          typeof history.secret !== 'undefined'
        ) {
          // history must be decrypted
          return this.decryptSecret(metadatas.id, history);
        }
        // no history yet
        return Promise.resolve([]);
      })
      .then(rHistory => {
        newHistory = rHistory;
        if (
          newHistory.length === 0 ||
          JSON.stringify(newHistory[0].secret) !== JSON.stringify(secret)
        ) {
          newHistory.unshift({
            secret,
            lastModifiedAt: metadatas.lastModifiedAt,
            lastModifiedBy: metadatas.lastModifiedBy,
          });
        }
        return this.cryptoAdapter.encryptAESGCM256(secret, key);
      })
      .then(secretObject => {
        result.secret = secretObject.secret;
        result.iv = secretObject.iv;
        result.key = secretObject.key;
        return this.cryptoAdapter.encryptAESGCM256(metadatas, secretObject.key);
      })
      .then(secretObject => {
        result.metadatas = secretObject.secret;
        result.iv_meta = secretObject.iv;
        return this.cryptoAdapter.encryptAESGCM256(
          newHistory,
          secretObject.key
        );
      })
      .then(secretObject => {
        result.history = secretObject.secret;
        result.iv_history = secretObject.iv;
        return this.cryptoAdapter.getSHA256(this.username);
      })
      .then(hashedUsername => {
        result.hashedUsername = hashedUsername;
        return result;
      });
  }

  decryptSecret(hashedTitle, secret) {
    if (typeof this.keys[hashedTitle] === 'undefined') {
      return Promise.reject("You don't have this secret");
    }
    const wrappedKey = this.keys[hashedTitle].key;
    return this.unwrapKey(wrappedKey).then(key =>
      this.cryptoAdapter.decryptAESGCM256(secret, key)
    );
  }

  unwrapKey(wrappedKey) {
    return this.cryptoAdapter.unwrapRSAOAEP(wrappedKey, this.privateKey);
  }

  wrapKey(key, publicKey) {
    return this.cryptoAdapter.wrapRSAOAEP(key, publicKey);
  }

  decryptAllMetadatas(allMetadatas, progress = defaultProgress) {
    const hashedTitles = Object.keys(this.keys);

    const progressStatus = new DecryptMetadataStatus(0, hashedTitles.length);
    progress(progressStatus);
    const metadatas = {};
    return hashedTitles
      .reduce(
        (promise, hashedTitle) =>
          promise.then(() =>
            this.decryptSecret(
              hashedTitle,
              allMetadatas[hashedTitle]
            ).then(metadata => {
              progressStatus.step();
              progress(progressStatus);
              metadatas[hashedTitle] = metadata;
            })
          ),
        Promise.resolve()
      )
      .then(() => metadatas);
  }

  activateShortLogin(shortpass, deviceName) {
    let protectKey;
    const toSend = {};
    return this.cryptoAdapter
      .generateWrappingKey()
      .then(key => {
        protectKey = key;
        return this.cryptoAdapter.exportKey(protectKey, this.privateKey);
      })
      .then(object => {
        localStorage.setItem(`${Secretin.prefix}privateKey`, object.key);
        localStorage.setItem(`${Secretin.prefix}privateKeyIv`, object.iv);
        return this.cryptoAdapter.derivePassword(shortpass);
      })
      .then(derived => {
        toSend.salt = derived.salt;
        toSend.iterations = derived.iterations;
        toSend.hash = derived.hash;
        return this.cryptoAdapter.exportKey(derived.key, protectKey);
      })
      .then(keyObject => {
        toSend.protectKey = keyObject.key;
        localStorage.setItem(`${Secretin.prefix}iv`, keyObject.iv);
        localStorage.setItem(`${Secretin.prefix}username`, this.username);
        return this.cryptoAdapter.getSHA256(deviceName);
      })
      .then(deviceId => {
        toSend.deviceId = deviceId;
        localStorage.setItem(`${Secretin.prefix}deviceName`, deviceName);
        return toSend;
      });
  }

  shortLogin(shortpass, wrappedProtectKey) {
    const keyObject = {
      key: wrappedProtectKey,
      iv: localStorage.getItem(`${Secretin.prefix}iv`),
    };
    return this.cryptoAdapter
      .importKey(shortpass, keyObject)
      .then(protectKey => {
        const privateKeyObject = {
          privateKey: localStorage.getItem(`${Secretin.prefix}privateKey`),
          iv: localStorage.getItem(`${Secretin.prefix}privateKeyIv`),
        };
        return this.importPrivateKey(protectKey, privateKeyObject);
      });
  }
}

Object.defineProperty(User, 'defaultOptions', {
  value: {
    timeToClose: 30,
  },
  writable: false,
  enumerable: true,
  configurable: false,
});

export default User;
