/**
 * Bikram Sambat (BS) Conversion and Nepali Localization Helpers
 * Section 65 & 66 of RenewIt System Design
 *
 * Provides AD to BS approximate mapping and Nepali month/digit formatters
 * used by Department of Transport Management (DOTM) and Inland Revenue (IRD) in Nepal.
 */

const NEPALI_MONTHS_EN = [
  "Baishakh",
  "Jestha",
  "Ashadh",
  "Shrawan",
  "Bhadra",
  "Ashwin",
  "Kartik",
  "Mangsir",
  "Poush",
  "Magh",
  "Falgun",
  "Chaitra",
];

const NEPALI_MONTHS_NP = [
  "बैशाख",
  "जेठ",
  "असार",
  "श्रावण",
  "भाद्र",
  "आश्विन",
  "कार्तिक",
  "मंसिर",
  "पौष",
  "माघ",
  "फाल्गुन",
  "चैत्र",
];

const NEPALI_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

export function toNepaliDigits(num: number | string): string {
  return num
    .toString()
    .split("")
    .map((ch) => (ch >= "0" && ch <= "9" ? NEPALI_DIGITS[parseInt(ch)] : ch))
    .join("");
}

/**
 * Approximate AD to BS date calculation
 * (Bikram Sambat is approximately 56 years, 8 months ahead of Gregorian calendar)
 */
export function getBikramSambatDate(adDate: Date | string): {
  year: number;
  month: number; // 0 to 11
  day: number;
  monthNameEn: string;
  monthNameNp: string;
  formattedEn: string;
  formattedNp: string;
} {
  const d = typeof adDate === "string" ? new Date(adDate) : adDate;
  const adYear = d.getUTCFullYear();
  const adMonth = d.getUTCMonth(); // 0-11
  const adDay = d.getUTCDate();

  // BS year offset: New year falls around mid-April (approx April 13-14)
  let bsYear = adYear + 57;
  let bsMonth = 0;
  let bsDay = adDay;

  // Approximate month alignment:
  // Jan = Poush (9), Feb = Magh (10), Mar = Falgun (11), Apr = Chaitra/Baishakh (0)
  if (adMonth === 0) {
    bsMonth = 9; // Poush/Magh
    bsDay = (adDay + 16) % 30 || 30;
    bsYear = adYear + 56;
  } else if (adMonth === 1) {
    bsMonth = 10; // Magh/Falgun
    bsDay = (adDay + 17) % 30 || 30;
    bsYear = adYear + 56;
  } else if (adMonth === 2) {
    bsMonth = 11; // Falgun/Chaitra
    bsDay = (adDay + 16) % 30 || 30;
    bsYear = adYear + 56;
  } else if (adMonth === 3) {
    if (adDay < 14) {
      bsMonth = 11; // Chaitra
      bsDay = adDay + 17;
      bsYear = adYear + 56;
    } else {
      bsMonth = 0; // Baishakh (New Year)
      bsDay = adDay - 13;
      bsYear = adYear + 57;
    }
  } else {
    // May to Dec
    const monthOffsets = [0, 1, 2, 3, 4, 5, 6, 7]; // Baishakh to Mangsir
    bsMonth = (adMonth - 3) % 12;
    bsDay = (adDay + 16) % 31 || 1;
    bsYear = adYear + 57;
  }

  const monthNameEn = NEPALI_MONTHS_EN[bsMonth] || "Baishakh";
  const monthNameNp = NEPALI_MONTHS_NP[bsMonth] || "बैशाख";

  return {
    year: bsYear,
    month: bsMonth,
    day: bsDay,
    monthNameEn,
    monthNameNp,
    formattedEn: `${bsDay} ${monthNameEn} ${bsYear} BS`,
    formattedNp: `${toNepaliDigits(bsYear)} ${monthNameNp} ${toNepaliDigits(bsDay)}`,
  };
}
