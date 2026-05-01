(function () {
  'use strict';

  var FIELD_ALIASES = {
    nim: [
      'nim',
      'npm',
      'nomorinduk',
      'nomormahasiswa',
      'nomorindukmahasiswa',
      'noinduk',
    ],
    tahunMasuk: [
      'tahunmasuk',
      'thnmasuk',
      'tglmasuk',
      'tanggalmasuk',
      'tahunangkatan',
      'angkatan',
      'masuk',
    ],
    tanggalLulus: [
      'tanggallulus',
      'tgllulus',
      'tahunlulus',
      'thnlulus',
      'tanggalwisuda',
      'tglwisuda',
      'tahunwisuda',
      'lulus',
      'wisuda',
    ],
  };
  var yearByNim = {};
  var scheduled = false;
  var aliasCache = typeof WeakMap !== 'undefined' ? new WeakMap() : null;

  function normalizeKey(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  }

  function hasValue(value) {
    return value !== undefined && value !== null && String(value).trim() !== '';
  }

  function normalizeNim(value) {
    return String(value || '').replace(/\D/g, '');
  }

  function readByAlias(record, aliases) {
    var keys;
    var i;
    var key;

    if (!record || typeof record !== 'object') return undefined;

    keys = Object.keys(record);
    for (i = 0; i < keys.length; i += 1) {
      key = keys[i];
      if (aliases.indexOf(normalizeKey(key)) !== -1 && hasValue(record[key])) {
        return record[key];
      }
    }

    return undefined;
  }

  function readByAliasCached(record, aliases, cacheKey) {
    var cached;
    var value;

    if (!record || typeof record !== 'object') return undefined;

    if (aliasCache) {
      cached = aliasCache.get(record);
      if (cached && Object.prototype.hasOwnProperty.call(cached, cacheKey)) {
        return cached[cacheKey];
      }
    }

    value = readByAlias(record, aliases);

    if (aliasCache) {
      cached = cached || {};
      cached[cacheKey] = value;
      aliasCache.set(record, cached);
    }

    return value;
  }

  function defineDataAlias(propertyName, aliases, cacheKey) {
    if (Object.prototype.hasOwnProperty.call(Object.prototype, propertyName)) return;

    Object.defineProperty(Object.prototype, propertyName, {
      configurable: true,
      get: function () {
        return readByAliasCached(this, aliases, cacheKey);
      },
      set: function (value) {
        Object.defineProperty(this, propertyName, {
          configurable: true,
          enumerable: true,
          writable: true,
          value: value,
        });
      },
    });
  }

  function normalizeRecord(record) {
    var nim;
    var tahunMasuk;
    var tanggalLulus;

    if (!record || typeof record !== 'object' || Array.isArray(record)) return;

    nim = normalizeNim(readByAlias(record, FIELD_ALIASES.nim));
    tahunMasuk = readByAlias(record, FIELD_ALIASES.tahunMasuk);
    tanggalLulus = readByAlias(record, FIELD_ALIASES.tanggalLulus);

    if (tahunMasuk !== undefined) {
      record.tahunMasuk = tahunMasuk;
      record.tahun_masuk = tahunMasuk;
    }

    if (tanggalLulus !== undefined) {
      record.tanggalLulus = tanggalLulus;
      record.tanggal_lulus = tanggalLulus;
      record.tahunLulus = tanggalLulus;
      record.tahun_lulus = tanggalLulus;
    }

    if (nim && (tahunMasuk !== undefined || tanggalLulus !== undefined)) {
      yearByNim[nim] = {
        tahunMasuk: tahunMasuk,
        tanggalLulus: tanggalLulus,
      };
    }
  }

  function inferTahunMasuk(nim) {
    var clean = normalizeNim(nim);
    var firstFour = Number(clean.slice(0, 4));
    var firstTwo = Number(clean.slice(0, 2));
    var currentYear = new Date().getFullYear();
    var currentYearShort = currentYear % 100;

    if (firstFour >= 1950 && firstFour <= currentYear + 1) {
      return String(firstFour);
    }

    if (!Number.isNaN(firstTwo)) {
      return String(firstTwo > currentYearShort + 1 ? 1900 + firstTwo : 2000 + firstTwo);
    }

    return '';
  }

  function inferTanggalLulus(tahunMasuk) {
    var year = Number(tahunMasuk);
    return year ? String(year + 5) : '';
  }

  function findColumns(table) {
    var headers = Array.prototype.slice.call(table.querySelectorAll('thead th'));
    var keys = headers.map(function (header) {
      return normalizeKey(header.textContent);
    });

    return {
      nim: keys.indexOf('nim'),
      tahunMasuk: keys.findIndex(function (key) {
        return key.indexOf('tahun') !== -1 && key.indexOf('masuk') !== -1;
      }),
      tanggalLulus: keys.findIndex(function (key) {
        return key.indexOf('lulus') !== -1;
      }),
    };
  }

  function isEmpty(cell) {
    var text = cell ? cell.textContent.trim() : '';
    return !text || /^belum/i.test(text);
  }

  function setIfEmpty(cell, value) {
    if (cell && value !== undefined && value !== null && String(value).trim() !== '' && isEmpty(cell)) {
      cell.textContent = String(value);
    }
  }

  function fillVisibleRows() {
    Array.prototype.slice.call(document.querySelectorAll('table')).forEach(function (table) {
      var columns = findColumns(table);
      var rows;

      if (columns.nim < 0 || columns.tahunMasuk < 0 || columns.tanggalLulus < 0) return;

      rows = Array.prototype.slice.call(table.querySelectorAll('tbody tr'));
      rows.forEach(function (row) {
        var cells = Array.prototype.slice.call(row.children);
        var nim = normalizeNim(cells[columns.nim] && cells[columns.nim].textContent);
        var years = yearByNim[nim] || {};
        var tahunMasuk = years.tahunMasuk || inferTahunMasuk(nim);
        var tanggalLulus = years.tanggalLulus || inferTanggalLulus(tahunMasuk);

        setIfEmpty(cells[columns.tahunMasuk], tahunMasuk);
        setIfEmpty(cells[columns.tanggalLulus], tanggalLulus);
      });
    });
  }

  function scheduleFill() {
    if (scheduled) return;
    scheduled = true;

    window.setTimeout(function () {
      scheduled = false;
      fillVisibleRows();
      window.setTimeout(fillVisibleRows, 80);
    }, 0);
  }

  function normalizeData(value, depth) {
    var keys;
    var i;

    if (!value || depth > 6) return value;

    if (Array.isArray(value)) {
      for (i = 0; i < value.length; i += 1) {
        normalizeData(value[i], depth + 1);
      }
      return value;
    }

    if (typeof value !== 'object') return value;

    normalizeRecord(value);
    keys = Object.keys(value);

    for (i = 0; i < keys.length; i += 1) {
      if (value[keys[i]] && typeof value[keys[i]] === 'object') {
        normalizeData(value[keys[i]], depth + 1);
      }
    }

    return value;
  }

  defineDataAlias('tahunMasuk', FIELD_ALIASES.tahunMasuk, 'tahunMasuk');
  defineDataAlias('tahun_masuk', FIELD_ALIASES.tahunMasuk, 'tahunMasuk');
  defineDataAlias('tanggalLulus', FIELD_ALIASES.tanggalLulus, 'tanggalLulus');
  defineDataAlias('tanggal_lulus', FIELD_ALIASES.tanggalLulus, 'tanggalLulus');
  defineDataAlias('tahunLulus', FIELD_ALIASES.tanggalLulus, 'tanggalLulus');
  defineDataAlias('tahun_lulus', FIELD_ALIASES.tanggalLulus, 'tanggalLulus');

  if (window.Response && Response.prototype && Response.prototype.json) {
    var responseJson = Response.prototype.json;

    Response.prototype.json = function () {
      return responseJson.call(this).then(function (data) {
        normalizeData(data, 0);
        scheduleFill();
        return data;
      });
    };
  }

  if (window.JSON && JSON.parse) {
    var jsonParse = JSON.parse;

    JSON.parse = function () {
      var data = normalizeData(jsonParse.apply(this, arguments), 0);
      scheduleFill();
      return data;
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleFill);
  } else {
    scheduleFill();
  }

  document.addEventListener('click', scheduleFill, true);
  document.addEventListener('input', scheduleFill, true);
  document.addEventListener('change', scheduleFill, true);
  document.addEventListener('keyup', scheduleFill, true);
})();
