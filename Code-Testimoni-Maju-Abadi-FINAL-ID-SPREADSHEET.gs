/**
 * MAJU ABADI GROUP - TESTIMONI
 * Spreadsheet dikunci langsung menggunakan ID berikut:
 * 1Z5Nb0_dmjjhWekKy8UrNWulyj1-csTV2ccV6gz3F5-s
 *
 * Pengunjung -> submit -> APPROVED otomatis -> tersimpan di Sheet
 */

const SPREADSHEET_ID = "1Z5Nb0_dmjjhWekKy8UrNWulyj1-csTV2ccV6gz3F5-s";
const SHEET_NAME = "Testimoni";

function getSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      "Timestamp",
      "Name",
      "Organization",
      "Rating",
      "Message",
      "Status"
    ]);
    sheet.setFrozenRows(1);
  }

  // Jika sheet ada tetapi benar-benar kosong, buat header.
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Timestamp",
      "Name",
      "Organization",
      "Rating",
      "Message",
      "Status"
    ]);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function setupSheet() {
  const sheet = getSheet_();
  sheet.getRange(1, 1, 1, 6).setFontWeight("bold");
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, 6);
}

function clean_(value, maxLength) {
  return String(value ?? "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, maxLength);
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  try {
    const action = e && e.parameter
      ? (e.parameter.action || "list")
      : "list";

    const sheet = getSheet_();

    // Ambil testimoni
    if (action === "list") {
      const lastRow = sheet.getLastRow();

      if (lastRow <= 1) {
        return json_({ ok: true, testimonials: [] });
      }

      const values = sheet
        .getRange(2, 1, lastRow - 1, 6)
        .getValues();

      const testimonials = values
        .filter(row => String(row[5] || "").toUpperCase() === "APPROVED")
        .map(row => ({
          timestamp: row[0],
          name: clean_(row[1], 80),
          organization: clean_(row[2], 100),
          rating: Math.max(1, Math.min(5, Number(row[3]) || 5)),
          message: clean_(row[4], 600)
        }))
        .reverse();

      return json_({ ok: true, testimonials });
    }

    // Simpan testimoni via GET
    if (action === "submit") {
      if (e.parameter.website) {
        return json_({ ok: true, message: "Terima kasih." });
      }

      const name = clean_(e.parameter.name, 80);
      const organization = clean_(e.parameter.organization, 100);
      const message = clean_(e.parameter.message, 600);
      const rating = Number(e.parameter.rating);

      if (!name || !message) {
        return json_({
          ok: false,
          message: "Nama dan testimoni wajib diisi."
        });
      }

      if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
        return json_({
          ok: false,
          message: "Rating tidak valid."
        });
      }

      sheet.appendRow([
        new Date(),
        name,
        organization,
        Math.round(rating),
        message,
        "APPROVED"
      ]);

      SpreadsheetApp.flush();

      return json_({
        ok: true,
        message: "Testimoni berhasil disimpan ke Google Sheets.",
        saved: true
      });
    }

    return json_({
      ok: false,
      message: "Action tidak dikenal."
    });

  } catch (error) {
    console.error(error);

    return json_({
      ok: false,
      message: String(error.message || error)
    });
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(
      e && e.postData ? e.postData.contents : "{}"
    );

    const sheet = getSheet_();

    if (data.website) {
      return json_({ ok: true, message: "Terima kasih." });
    }

    const name = clean_(data.name, 80);
    const organization = clean_(data.organization, 100);
    const message = clean_(data.message, 600);
    const rating = Number(data.rating);

    if (!name || !message) {
      return json_({
        ok: false,
        message: "Nama dan testimoni wajib diisi."
      });
    }

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return json_({
        ok: false,
        message: "Rating tidak valid."
      });
    }

    sheet.appendRow([
      new Date(),
      name,
      organization,
      Math.round(rating),
      message,
      "APPROVED"
    ]);

    SpreadsheetApp.flush();

    return json_({
      ok: true,
      message: "Testimoni berhasil disimpan ke Google Sheets.",
      saved: true
    });

  } catch (error) {
    console.error(error);

    return json_({
      ok: false,
      message: String(error.message || error)
    });
  }
}
