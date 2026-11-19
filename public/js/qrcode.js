/*
 * QR Code generator (modo byte / UTF-8) — porta compacta do gerador de
 * Project Nayuki (MIT License, https://www.nayuki.io/page/qr-code-generator-library).
 * Expõe window.QRCode.draw(canvas, text, opts) e window.QRCode.toSVG(text, opts).
 * Usado apenas para gerar o QR do PIX Copia e Cola a partir de dados válidos.
 */
(function (global) {
  "use strict";

  // ---- Reed-Solomon / Galois field (GF(256), 0x11D) ----
  function rsMultiply(x, y) {
    let z = 0;
    for (let i = 7; i >= 0; i--) {
      z = (z << 1) ^ ((z >>> 7) * 0x11d);
      z ^= ((y >>> i) & 1) * x;
    }
    return z & 0xff;
  }
  function rsComputeDivisor(degree) {
    const result = new Uint8Array(degree);
    result[degree - 1] = 1;
    let root = 1;
    for (let i = 0; i < degree; i++) {
      for (let j = 0; j < result.length; j++) {
        result[j] = rsMultiply(result[j], root);
        if (j + 1 < result.length) result[j] ^= result[j + 1];
      }
      root = rsMultiply(root, 0x02);
    }
    return result;
  }
  function rsRemainder(data, divisor) {
    const result = new Uint8Array(divisor.length);
    for (const b of data) {
      const factor = b ^ result[0];
      result.copyWithin(0, 1);
      result[result.length - 1] = 0;
      for (let i = 0; i < result.length; i++) result[i] ^= rsMultiply(divisor[i], factor);
    }
    return result;
  }

  // ---- Tabelas ----
  const ECC_CODEWORDS_PER_BLOCK = [
    [-1,7,10,15,20,26,18,20,24,30,18,20,24,26,30,22,24,28,30,28,28,28,28,30,30,26,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30],
    [-1,10,16,26,18,24,16,18,22,22,26,30,22,22,24,24,28,28,26,26,26,26,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28],
    [-1,13,22,18,26,18,24,18,22,20,24,28,26,24,20,30,24,28,28,26,30,28,30,30,30,30,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30],
    [-1,17,28,22,16,22,28,26,26,24,28,24,28,22,24,24,30,28,28,26,28,30,24,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30],
  ];
  const NUM_ERROR_CORRECTION_BLOCKS = [
    [-1,1,1,1,1,1,2,2,2,2,4,4,4,4,4,6,6,6,6,7,8,8,9,9,10,12,12,12,13,14,15,16,17,18,19,19,20,21,22,24,25],
    [-1,1,1,1,2,2,4,4,4,5,5,5,8,9,9,10,10,11,13,14,16,17,17,18,20,21,23,25,26,28,29,31,33,35,37,38,40,43,45,47,49],
    [-1,1,1,2,2,4,4,6,6,8,8,8,10,12,16,12,17,16,18,21,20,23,23,25,27,29,34,34,35,38,40,43,45,48,51,53,56,59,62,65,68],
    [-1,1,1,2,4,4,4,5,6,8,8,11,11,16,16,18,16,19,21,25,25,25,34,30,32,35,37,40,42,45,48,51,54,57,60,63,66,70,74,77,81],
  ];
  // Nível M por padrão (índice 1). Ordem: L=0, M=1, Q=2, H=3.
  const ECL_M = 1;

  function getNumRawDataModules(ver) {
    let result = (16 * ver + 128) * ver + 64;
    if (ver >= 2) {
      const numAlign = Math.floor(ver / 7) + 2;
      result -= (25 * numAlign - 10) * numAlign - 55;
      if (ver >= 7) result -= 36;
    }
    return result;
  }
  function getNumDataCodewords(ver, ecl) {
    return (
      Math.floor(getNumRawDataModules(ver) / 8) -
      ECC_CODEWORDS_PER_BLOCK[ecl][ver] * NUM_ERROR_CORRECTION_BLOCKS[ecl][ver]
    );
  }

  // ---- Segmento em modo byte (UTF-8) ----
  function toUtf8Bytes(str) {
    return new TextEncoder().encode(str);
  }

  function makeBitBuffer(data, ver, ecl) {
    const bb = [];
    const appendBits = (val, len) => {
      for (let i = len - 1; i >= 0; i--) bb.push((val >>> i) & 1);
    };
    // Modo byte = 0100, indicador de contagem de caractere.
    appendBits(0x4, 4);
    const ccBits = ver <= 9 ? 8 : 16;
    appendBits(data.length, ccBits);
    for (const b of data) appendBits(b, 8);

    const capacityBits = getNumDataCodewords(ver, ecl) * 8;
    appendBits(0, Math.min(4, capacityBits - bb.length));
    while (bb.length % 8 !== 0) bb.push(0);
    for (let pad = 0xec; bb.length < capacityBits; pad ^= 0xec ^ 0x11) appendBits(pad, 8);

    const dataCodewords = new Uint8Array(bb.length / 8);
    for (let i = 0; i < bb.length; i++) dataCodewords[i >>> 3] |= bb[i] << (7 - (i & 7));
    return dataCodewords;
  }

  function chooseVersion(numBytes, ecl) {
    for (let ver = 1; ver <= 40; ver++) {
      const capacity = getNumDataCodewords(ver, ecl);
      const ccBits = ver <= 9 ? 8 : 16;
      const needed = Math.ceil((4 + ccBits) / 8) + numBytes; // aproximação segura por bytes
      // cálculo exato em bits:
      const usedBits = 4 + ccBits + numBytes * 8;
      if (usedBits <= capacity * 8) return ver;
      void needed;
    }
    throw new Error("Dados longos demais para um QR Code.");
  }

  // ---- Monta a matriz ----
  function QRMatrix(ver) {
    this.version = ver;
    this.size = ver * 4 + 17;
    this.modules = [];
    this.isFunction = [];
    for (let i = 0; i < this.size; i++) {
      this.modules.push(new Array(this.size).fill(false));
      this.isFunction.push(new Array(this.size).fill(false));
    }
  }

  QRMatrix.prototype.setFunctionModule = function (x, y, isDark) {
    this.modules[y][x] = isDark;
    this.isFunction[y][x] = true;
  };

  QRMatrix.prototype.drawFinder = function (x, y) {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        const xx = x + dx, yy = y + dy;
        if (xx >= 0 && xx < this.size && yy >= 0 && yy < this.size) {
          this.setFunctionModule(xx, yy, dist !== 2 && dist !== 4);
        }
      }
    }
  };

  QRMatrix.prototype.drawAlignment = function (x, y) {
    for (let dy = -2; dy <= 2; dy++)
      for (let dx = -2; dx <= 2; dx++)
        this.setFunctionModule(x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
  };

  QRMatrix.prototype.getAlignmentPositions = function () {
    const ver = this.version;
    if (ver === 1) return [];
    const numAlign = Math.floor(ver / 7) + 2;
    const step = ver === 32 ? 26 : Math.ceil((ver * 4 + 4) / (numAlign * 2 - 2)) * 2;
    const result = [6];
    for (let pos = this.size - 7; result.length < numAlign; pos -= step) result.splice(1, 0, pos);
    return result;
  };

  QRMatrix.prototype.drawFunctionPatterns = function () {
    const size = this.size;
    // Timing patterns
    for (let i = 0; i < size; i++) {
      this.setFunctionModule(6, i, i % 2 === 0);
      this.setFunctionModule(i, 6, i % 2 === 0);
    }
    this.drawFinder(3, 3);
    this.drawFinder(size - 4, 3);
    this.drawFinder(3, size - 4);
    // Alignment
    const pos = this.getAlignmentPositions();
    const n = pos.length;
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        if ((i === 0 && j === 0) || (i === 0 && j === n - 1) || (i === n - 1 && j === 0)) continue;
        this.drawAlignment(pos[i], pos[j]);
      }
    // Reserva de formato/versão (preenchido depois)
    this.drawFormatBits(0);
    this.drawVersion();
  };

  QRMatrix.prototype.drawFormatBits = function (mask) {
    const data = (ECL_M_BITS << 3) | mask; // 5 bits
    let rem = data;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const bits = ((data << 10) | rem) ^ 0x5412;
    for (let i = 0; i <= 5; i++) this.setFunctionModule(8, i, getBit(bits, i));
    this.setFunctionModule(8, 7, getBit(bits, 6));
    this.setFunctionModule(8, 8, getBit(bits, 7));
    this.setFunctionModule(7, 8, getBit(bits, 8));
    for (let i = 9; i < 15; i++) this.setFunctionModule(14 - i, 8, getBit(bits, i));
    const size = this.size;
    for (let i = 0; i < 8; i++) this.setFunctionModule(size - 1 - i, 8, getBit(bits, i));
    for (let i = 8; i < 15; i++) this.setFunctionModule(8, size - 15 + i, getBit(bits, i));
    this.setFunctionModule(8, size - 8, true); // módulo sempre escuro
  };

  QRMatrix.prototype.drawVersion = function () {
    if (this.version < 7) return;
    let rem = this.version;
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const bits = (this.version << 12) | rem;
    for (let i = 0; i < 18; i++) {
      const bit = getBit(bits, i);
      const a = this.size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      this.setFunctionModule(a, b, bit);
      this.setFunctionModule(b, a, bit);
    }
  };

  QRMatrix.prototype.drawCodewords = function (codewords) {
    const size = this.size;
    let i = 0;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let vert = 0; vert < size; vert++) {
        for (let j = 0; j < 2; j++) {
          const x = right - j;
          const upward = ((right + 1) & 2) === 0;
          const y = upward ? size - 1 - vert : vert;
          if (!this.isFunction[y][x] && i < codewords.length * 8) {
            this.modules[y][x] = getBit(codewords[i >>> 3], 7 - (i & 7));
            i++;
          }
        }
      }
    }
  };

  QRMatrix.prototype.applyMask = function (mask) {
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (this.isFunction[y][x]) continue;
        let invert;
        switch (mask) {
          case 0: invert = (x + y) % 2 === 0; break;
          case 1: invert = y % 2 === 0; break;
          case 2: invert = x % 3 === 0; break;
          case 3: invert = (x + y) % 3 === 0; break;
          case 4: invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
          case 5: invert = ((x * y) % 2) + ((x * y) % 3) === 0; break;
          case 6: invert = (((x * y) % 2) + ((x * y) % 3)) % 2 === 0; break;
          case 7: invert = (((x + y) % 2) + ((x * y) % 3)) % 2 === 0; break;
        }
        if (invert) this.modules[y][x] = !this.modules[y][x];
      }
    }
  };

  QRMatrix.prototype.getPenaltyScore = function () {
    const size = this.size, mod = this.modules;
    let result = 0;
    // Regras de adjacência horizontal e vertical
    for (let y = 0; y < size; y++) {
      let runColor = false, runX = 0;
      for (let x = 0; x < size; x++) {
        if (mod[y][x] === runColor) { runX++; if (runX === 5) result += 3; else if (runX > 5) result++; }
        else { runColor = mod[y][x]; runX = 1; }
      }
    }
    for (let x = 0; x < size; x++) {
      let runColor = false, runY = 0;
      for (let y = 0; y < size; y++) {
        if (mod[y][x] === runColor) { runY++; if (runY === 5) result += 3; else if (runY > 5) result++; }
        else { runColor = mod[y][x]; runY = 1; }
      }
    }
    // Blocos 2x2
    for (let y = 0; y < size - 1; y++)
      for (let x = 0; x < size - 1; x++) {
        const c = mod[y][x];
        if (c === mod[y][x + 1] && c === mod[y + 1][x] && c === mod[y + 1][x + 1]) result += 3;
      }
    // Proporção dark/total
    let dark = 0;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (mod[y][x]) dark++;
    const total = size * size;
    const k = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1;
    result += k * 10;
    return result;
  };

  function getBit(x, i) { return ((x >>> i) & 1) !== 0; }
  const ECL_M_BITS = 0; // bits do nível M no formato é 0b00

  // Blocos intercalados com ECC
  function addEcc(dataCodewords, ver, ecl) {
    const numBlocks = NUM_ERROR_CORRECTION_BLOCKS[ecl][ver];
    const blockEccLen = ECC_CODEWORDS_PER_BLOCK[ecl][ver];
    const rawCodewords = Math.floor(getNumRawDataModules(ver) / 8);
    const numShortBlocks = numBlocks - (rawCodewords % numBlocks);
    const shortBlockLen = Math.floor(rawCodewords / numBlocks);

    const blocks = [];
    const rsDiv = rsComputeDivisor(blockEccLen);
    let k = 0;
    for (let i = 0; i < numBlocks; i++) {
      const datLen = shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1);
      const dat = dataCodewords.slice(k, k + datLen);
      k += datLen;
      const ecc = rsRemainder(dat, rsDiv);
      const block = Array.from(dat);
      if (i < numShortBlocks) block.push(0); // placeholder para alinhar
      for (const e of ecc) block.push(e);
      blocks.push({ block, datLen });
    }

    const result = [];
    const maxLen = shortBlockLen + 1;
    for (let i = 0; i < maxLen; i++) {
      for (let j = 0; j < blocks.length; j++) {
        // pula o byte de preenchimento dos blocos curtos na parte de dados
        if (i === shortBlockLen - blockEccLen && j < numShortBlocks) continue;
        const b = blocks[j].block;
        if (i < b.length) result.push(b[i]);
      }
    }
    return new Uint8Array(result);
  }

  function encode(text) {
    const ecl = ECL_M;
    const bytes = toUtf8Bytes(text);
    const ver = chooseVersion(bytes.length, ecl);
    const dataCodewords = makeBitBuffer(bytes, ver, ecl);
    const allCodewords = addEcc(dataCodewords, ver, ecl);

    const qr = new QRMatrix(ver);
    qr.drawFunctionPatterns();
    qr.drawCodewords(allCodewords);

    // Escolhe a melhor máscara
    let bestMask = 0, minPenalty = Infinity;
    for (let mask = 0; mask < 8; mask++) {
      qr.applyMask(mask);
      qr.drawFormatBits(mask);
      const penalty = qr.getPenaltyScore();
      if (penalty < minPenalty) { minPenalty = penalty; bestMask = mask; }
      qr.applyMask(mask); // desfaz
    }
    qr.applyMask(bestMask);
    qr.drawFormatBits(bestMask);
    return qr;
  }

  // ---- API pública ----
  const QRCode = {
    generate: encode,
    draw(canvas, text, opts) {
      opts = opts || {};
      const scale = opts.scale || 6;
      const border = opts.border != null ? opts.border : 4;
      const qr = encode(text);
      const dim = (qr.size + border * 2) * scale;
      canvas.width = dim;
      canvas.height = dim;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = opts.light || "#ffffff";
      ctx.fillRect(0, 0, dim, dim);
      ctx.fillStyle = opts.dark || "#2f4a2b";
      for (let y = 0; y < qr.size; y++)
        for (let x = 0; x < qr.size; x++)
          if (qr.modules[y][x])
            ctx.fillRect((x + border) * scale, (y + border) * scale, scale, scale);
      return canvas;
    },
    toSVG(text, opts) {
      opts = opts || {};
      const border = opts.border != null ? opts.border : 4;
      const qr = encode(text);
      const dim = qr.size + border * 2;
      let path = "";
      for (let y = 0; y < qr.size; y++)
        for (let x = 0; x < qr.size; x++)
          if (qr.modules[y][x]) path += `M${x + border},${y + border}h1v1h-1z`;
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dim} ${dim}" width="${opts.width || 220}" height="${opts.width || 220}"><rect width="${dim}" height="${dim}" fill="${opts.light || "#fff"}"/><path d="${path}" fill="${opts.dark || "#2f4a2b"}"/></svg>`;
    },
  };

  global.QRCode = QRCode;
})(typeof window !== "undefined" ? window : this);
