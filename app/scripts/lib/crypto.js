function SHA256(str){
  var algorithm = 'SHA-256';
  var data = asciiToUint8Array(str);
  return crypto.subtle.digest(algorithm, data);
}

function genRSAOAEP(){
  var algorithm = {
    name: 'RSA-OAEP',
    modulusLength: 4096,
    publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
    hash: {name: 'SHA-256'}
  };
  var extractable = true;
  var keyUsages = [
    'wrapKey',
    'unwrapKey',
    'encrypt',
    'decrypt'
  ];
  return crypto.subtle.generateKey(algorithm, extractable, keyUsages);
}

function encryptAESCBC256(secret, key){
  var result = {};
  var algorithm = {};
  if(typeof key === 'undefined'){
    algorithm = {
      name: 'AES-CBC',
      length: 256
    };
    var extractable = true;
    var keyUsages = [
      'encrypt'
    ];
    return crypto.subtle.generateKey(algorithm, extractable, keyUsages).then(function(key){
      var iv = new Uint8Array(16);
      crypto.getRandomValues(iv);
      algorithm = {
        name: 'AES-CBC',
        iv: iv
      };
      var data = asciiToUint8Array(secret);
      result.key = key;
      result.iv = iv;
      return crypto.subtle.encrypt(algorithm, key, data);
    }).then(function(encryptedSecret){
      result.secret = encryptedSecret;
      return result;
    });
  }
  else{
    result.key = key;
    var iv = new Uint8Array(16);
    crypto.getRandomValues(iv);
    algorithm = {
      name: 'AES-CBC',
      iv: iv
    };
    var data = asciiToUint8Array(secret);
    result.iv = iv;
    return crypto.subtle.encrypt(algorithm, key, data).then(function(encryptedSecret){
      result.secret = encryptedSecret;
      return result;
    });
  }
}

function decryptAESCBC256(secretObject, key){
  var algorithm = {
    name: 'AES-CBC',
    iv: hexStringToUint8Array(secretObject.iv)
  };
  var data = hexStringToUint8Array(secretObject.secret);
  return crypto.subtle.decrypt(algorithm, key, data);
}

function encryptRSAOAEP(secret, publicKey){
  var algorithm = {
    name: 'RSA-OAEP',
    hash: {name: 'SHA-256'}
  };
  var data = asciiToUint8Array(secret);
  return crypto.subtle.encrypt(algorithm, publicKey, data);
}

function decryptRSAOAEP(secret, privateKey){
  var algorithm = {
    name: 'RSA-OAEP',
    hash: {name: 'SHA-256'}
  };
  var data = hexStringToUint8Array(secret);
  return crypto.subtle.decrypt(algorithm, privateKey, data);
}

function wrapRSAOAEP(key, wrappingPublicKey){
  var format = 'raw';
  var wrapAlgorithm = {
    name: 'RSA-OAEP',
    hash: {name: 'SHA-256'}
  };
  return crypto.subtle.wrapKey(format, key, wrappingPublicKey, wrapAlgorithm);
}

function unwrapRSAOAEP(wrappedKeyHex, unwrappingPrivateKey){
  var format = 'raw';
  var wrappedKey = hexStringToUint8Array(wrappedKeyHex);
  var unwrapAlgorithm = {
    name: 'RSA-OAEP',
    hash: {name: 'SHA-256'}
  };
  var unwrappedKeyAlgorithm  = {
    name: 'AES-CBC',
    length: 256
  };
  var extractable = true;
  var usages = ['decrypt', 'encrypt'];

  return crypto.subtle.unwrapKey(
    format, wrappedKey, unwrappingPrivateKey, unwrapAlgorithm, unwrappedKeyAlgorithm, extractable, usages
  );
}

function exportPublicKey(publicKey){
  var format = 'jwk';
  return crypto.subtle.exportKey(format, publicKey);
}

function importPublicKey(jwkPublicKey){
  var format = 'jwk';
  var algorithm = {
    name: "RSA-OAEP",
    hash: {name: "SHA-256"}
  };
  var extractable = false;
  var keyUsages = [
    'wrapKey', 'encrypt'
  ];
  return crypto.subtle.importKey(format, jwkPublicKey, algorithm, extractable, keyUsages);
}

function hashExpress(bytesPromise, i){
  var iterations = 10000;
  if(i < iterations){
    return bytesPromise.then(function(hash){
      var hashPromise = crypto.subtle.digest('SHA-256', hash);
      return hashExpress(hashPromise, i+1);
    });
  }
  else{
    return bytesPromise;
  }
}

function derivePassword(password, salt){

  var saltBuf;
  var passwordBuf = asciiToUint8Array(password);

  if(typeof salt === 'undefined'){
    saltBuf = new Uint8Array(32);
    crypto.getRandomValues(saltBuf);
  }
  else{
    saltBuf = hexStringToUint8Array(salt);
  }

  var arrayBuffer = new Uint8Array(passwordBuf.length+saltBuf.length);
  for(var i = 0; i < passwordBuf.length+saltBuf.length; i++){
    if(i < passwordBuf.length){
      arrayBuffer[i] = passwordBuf[i];
    }
    else{
      arrayBuffer[i] = saltBuf[i-passwordBuf.length];
    }
  }

  var result = {};
  var lastHash;

  var hashPromise = crypto.subtle.digest('SHA-256', arrayBuffer);
  return hashExpress(hashPromise, 0).then(function(hash){
    var format = 'raw';
    var algorithm = {
      name: 'AES-CBC'
    };
    var extractable = false;
    var keyUsages = [
      'wrapKey',
      'unwrapKey'
    ];
    lastHash = hash;

    return crypto.subtle.importKey(format, hash, algorithm, extractable, keyUsages);
  }).then(function(key){
    result.key = key;
    result.salt = saltBuf;
    return crypto.subtle.digest('SHA-256', lastHash);
  }).then(function(hashedKey){
    result.hash = hashedKey;
    return result;
  });
}

function exportPrivateKey(key, privateKey){
  var result = {};
  var format = 'jwk';
  var iv = new Uint8Array(16);
  crypto.getRandomValues(iv);
  var wrapAlgorithm = {
    name: "AES-CBC",
    iv: iv
  };
  result.iv = iv;
  return crypto.subtle.wrapKey(
    format, privateKey, key, wrapAlgorithm
  ).then(function(wrappedPrivateKey){
    result.privateKey = wrappedPrivateKey;
    return result;
  });
}

function importPrivateKey(key, privateKeyObject){
  var format = 'jwk';
  var wrappedPrivateKey = hexStringToUint8Array(privateKeyObject.privateKey);
  var unwrapAlgorithm = {
    name: 'AES-CBC',
    iv: hexStringToUint8Array(privateKeyObject.iv)
  };
  var unwrappedKeyAlgorithm = {
    name: "RSA-OAEP",
    hash: {name: "sha-256"}
  };
  var extractable = true;
  var keyUsages = ['unwrapKey', 'decrypt'];

  return crypto.subtle.unwrapKey(
    format, wrappedPrivateKey, key, unwrapAlgorithm, unwrappedKeyAlgorithm, extractable, keyUsages
  ).then(function(privateKey){
    return privateKey;
  }).catch(function(err){
    throw('Invalid Password');
  });
}