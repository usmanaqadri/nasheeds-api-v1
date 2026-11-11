require("dotenv").config();

const mongoose = require("mongoose");
const NasheedV1 = require("../models/nasheed");
const NasheedV2 = require("../models/nasheed_v2");

const WRITE = process.argv.includes("--write");
const DRY_RUN = !WRITE;

// -------------------------------------------
// Migration overrides
// -------------------------------------------

const OVERRIDES = {
  "Yā Nabī (Naat)": {
    stanzaSize: 3,
    refrain: {
      lines: ["یا نبی یا نبی یا نبی یا نبی"],
    },
  },

  "Qaṣīda Muḥammadiyya": {
    stanzaSize: 1,
    refrain: {
      lines: [
        "سَلَام عَلَيك يا نَبِي سَلَام عَلَيك سَيِّدِي",
        "يَا نَبِي يَا إمَامَ الْحَرَمَيْن",
      ],
      allowPartial: true,
    },
  },
};

// -------------------------------------------
// Text utilities
// -------------------------------------------

function cleanText(value = "") {
  return String(value ?? "")
    .replace(/<div\b[^>]*>\s*<\/div>/gi, "")
    .replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u2069\uFEFF]/g, "")
    .replace(/\r/g, "")
    .trim();
}

function normalizeArabic(value = "") {
  return cleanText(value)
    .normalize("NFKC")
    .replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u2069\uFEFF]/g, "")
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/ـ/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

function normalizeForComparison(value, field) {
  if (field === "arab") {
    return normalizeArabic(value);
  }

  return cleanText(value)
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[.,!?;:،؛'’‘"“”\-‐‑–—]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function trimTrailingEmptyLines(values = []) {
  const result = [...values];

  while (result.length && cleanText(result[result.length - 1]) === "") {
    result.pop();
  }

  return result;
}

function newId() {
  return new mongoose.Types.ObjectId();
}

function keyForLines(lines) {
  return JSON.stringify(lines.map((line) => line.key));
}

function lineMatches(a, b) {
  return a.key === b.key;
}

// -------------------------------------------
// Prepare original lines
// -------------------------------------------

function prepareOccurrences(old) {
  const arab = old.arab || [];
  const rom = trimTrailingEmptyLines(old.rom || []);
  const eng = old.eng || [];

  const warnings = [];
  const errors = [];

  if (arab.length !== eng.length) {
    errors.push(`Arabic/English length mismatch: ${arab.length}/${eng.length}`);
  }

  if (arab.length !== rom.length) {
    errors.push(
      `Arabic/Romanized length mismatch after trimming: ` +
        `${arab.length}/${rom.length}`,
    );
  }

  const occurrences = arab.map((text, index) => ({
    oldIndex: index,
    arab: cleanText(text),
    rom: cleanText(rom[index] ?? ""),
    eng: cleanText(eng[index] ?? ""),
    key: normalizeArabic(text),
  }));

  occurrences.forEach((line, index) => {
    if (!line.key) {
      warnings.push(`Empty Arabic line at index ${index}`);
    }
  });

  return { occurrences, warnings, errors };
}

// -------------------------------------------
// Detect refrain definitions
// -------------------------------------------

function getOverride(old) {
  return OVERRIDES[old.engTitle] || {};
}

function detectOverrideRefrains(occurrences, config) {
  const definitions = [];

  if (!config.refrain) {
    return definitions;
  }

  const normalized = config.refrain.lines.map(normalizeArabic);

  definitions.push({
    name: "Full Refrain",
    keys: normalized,
  });

  if (config.refrain.allowPartial) {
    for (let i = 0; i < normalized.length; i++) {
      definitions.push({
        name: `Partial Refrain ${i + 1}`,
        keys: [normalized[i]],
      });
    }
  }

  return definitions;
}

function detectAutomaticRefrains(occurrences) {
  const pairCounts = new Map();

  // Count non-overlapping consecutive pairs at
  // couplet boundaries first.
  for (let i = 0; i + 1 < occurrences.length; i += 2) {
    const key = keyForLines([occurrences[i], occurrences[i + 1]]);

    pairCounts.set(key, (pairCounts.get(key) || 0) + 1);
  }

  const repeatedPairs = [...pairCounts.entries()]
    .filter(([, count]) => count >= 2)
    .map(([serialized]) => JSON.parse(serialized));

  if (repeatedPairs.length > 0) {
    return repeatedPairs.map((keys, index) => ({
      name: `Refrain ${index + 1}`,
      keys,
    }));
  }

  // If there are no repeated couplets, look for
  // repeated individual lines.
  const lineCounts = new Map();

  for (const line of occurrences) {
    lineCounts.set(line.key, (lineCounts.get(line.key) || 0) + 1);
  }

  return [...lineCounts.entries()]
    .filter(([key, count]) => key && count >= 2)
    .map(([key], index) => ({
      name: `Refrain ${index + 1}`,
      keys: [key],
    }));
}

function getRefrainDefinitions(old, occurrences) {
  const config = getOverride(old);

  const definitions = config.refrain
    ? detectOverrideRefrains(occurrences, config)
    : detectAutomaticRefrains(occurrences);

  // Longest matches first.
  return definitions.sort((a, b) => b.keys.length - a.keys.length);
}

// -------------------------------------------
// Tokenize performance sequence
// -------------------------------------------

function matchRefrainAt(occurrences, index, definitions) {
  for (const definition of definitions) {
    if (index + definition.keys.length > occurrences.length) {
      continue;
    }

    const matches = definition.keys.every(
      (key, offset) => occurrences[index + offset].key === key,
    );

    if (matches) {
      return definition;
    }
  }

  return null;
}

function tokenizeSequence(occurrences, definitions) {
  const tokens = [];

  let i = 0;

  while (i < occurrences.length) {
    const match = matchRefrainAt(occurrences, i, definitions);

    if (match) {
      tokens.push({
        type: "refrain",
        definition: match,
        lines: occurrences.slice(i, i + match.keys.length),
      });

      i += match.keys.length;
    } else {
      tokens.push({
        type: "line",
        lines: [occurrences[i]],
      });

      i++;
    }
  }

  return tokens;
}

// -------------------------------------------
// Group ordinary lines into stanzas
// -------------------------------------------

function groupIntoStanzas(tokens, stanzaSize) {
  const grouped = [];
  let pending = [];

  function flush() {
    if (!pending.length) return;

    grouped.push({
      type: "stanza",
      lines: pending,
    });

    pending = [];
  }

  for (const token of tokens) {
    if (token.type === "refrain") {
      flush();
      grouped.push(token);
      continue;
    }

    pending.push(...token.lines);

    if (pending.length >= stanzaSize) {
      flush();
    }
  }

  flush();

  return grouped;
}

// -------------------------------------------
// Build V2 document
// -------------------------------------------

function buildV2(old, grouped) {
  const stanzas = [];
  const refrains = [];
  const sequence = [];
  const footnotes = [];

  const oldIndexToLineId = new Map();

  // Canonical refrain stanza by normalized line.
  const canonicalLines = new Map();

  // Refrain definition -> refrain ID
  const refrainMap = new Map();

  function createStanza(lines) {
    const stanzaId = newId();

    const newLines = lines.map((line) => {
      const lineId = newId();

      oldIndexToLineId.set(line.oldIndex, lineId);

      return {
        _id: lineId,
        arab: line.arab,
        rom: line.rom,
        eng: line.eng,
      };
    });

    stanzas.push({
      _id: stanzaId,
      lines: newLines,
    });

    return { stanzaId, newLines };
  }

  // First, create canonical stanzas for full refrains.
  // Other refrain variations may reuse their lines.
  const refrainGroups = grouped.filter((group) => group.type === "refrain");

  const sortedRefrainGroups = [...refrainGroups].sort(
    (a, b) => b.lines.length - a.lines.length,
  );

  for (const group of sortedRefrainGroups) {
    for (const line of group.lines) {
      if (!canonicalLines.has(line.key)) {
        canonicalLines.set(line.key, {
          arab: line.arab,
          rom: line.rom,
          eng: line.eng,
        });
      }
    }
  }

  // Create refrain stanzas, preferring full refrains.
  const processedDefinitions = new Map();

  for (const group of sortedRefrainGroups) {
    const definitionKey = JSON.stringify(group.definition.keys);

    if (processedDefinitions.has(definitionKey)) {
      continue;
    }

    const existingParent = stanzas.find((stanza) =>
      group.lines.every((line) =>
        stanza.lines.some(
          (stored) => normalizeArabic(stored.arab) === line.key,
        ),
      ),
    );

    let stanzaId;
    let lineIds;

    if (existingParent) {
      stanzaId = existingParent._id;

      lineIds = group.lines.map((line) => {
        const stored = existingParent.lines.find(
          (candidate) => normalizeArabic(candidate.arab) === line.key,
        );

        return stored._id;
      });
    } else {
      const created = createStanza(group.lines);

      stanzaId = created.stanzaId;
      lineIds = created.newLines.map((line) => line._id);
    }

    const refrainId = newId();

    refrains.push({
      _id: refrainId,
      name: group.definition.name,
      stanzaId,
      lineIds:
        lineIds.length ===
        stanzas.find((stanza) => stanza._id.toString() === stanzaId.toString())
          .lines.length
          ? []
          : lineIds,
    });

    processedDefinitions.set(definitionKey, {
      refrainId,
      stanzaId,
      lineIds,
    });
  }

  // Build the actual performance sequence.
  for (const group of grouped) {
    if (group.type === "refrain") {
      const definitionKey = JSON.stringify(group.definition.keys);

      const definition = processedDefinitions.get(definitionKey);

      sequence.push({
        type: "refrain",
        refrainId: definition.refrainId,
      });

      group.lines.forEach((line, index) => {
        oldIndexToLineId.set(line.oldIndex, definition.lineIds[index]);
      });
    } else {
      const created = createStanza(group.lines);

      sequence.push({
        type: "stanza",
        stanzaId: created.stanzaId,
      });
    }
  }

  for (const note of old.footnotes || []) {
    const lineId = oldIndexToLineId.get(note.verseIndex);

    if (!lineId) {
      throw new Error(
        `Footnote cannot be mapped: verseIndex=${note.verseIndex}`,
      );
    }

    footnotes.push({
      lineId,
      range: note.range,
      content: note.content,
    });
  }

  return {
    _id: old._id,
    arabTitle: old.arabTitle,
    engTitle: old.engTitle,
    creatorId: old.creatorId,
    isPublic: old.isPublic,
    stanzas,
    refrains,
    sequence,
    footnotes,
    recordings: [],
    schemaVersion: 2,
  };
}

// -------------------------------------------
// Validate reconstructed performance
// -------------------------------------------

function reconstructSequence(doc) {
  const stanzaMap = new Map(
    doc.stanzas.map((stanza) => [stanza._id.toString(), stanza]),
  );

  const refrainMap = new Map(
    doc.refrains.map((refrain) => [refrain._id.toString(), refrain]),
  );

  const result = [];

  for (const item of doc.sequence) {
    if (item.type === "stanza") {
      const stanza = stanzaMap.get(item.stanzaId.toString());

      if (!stanza) {
        throw new Error("Missing stanza reference");
      }

      result.push(...stanza.lines);
      continue;
    }

    const refrain = refrainMap.get(item.refrainId.toString());

    if (!refrain) {
      throw new Error("Missing refrain reference");
    }

    const stanza = stanzaMap.get(refrain.stanzaId.toString());

    if (!stanza) {
      throw new Error("Missing refrain stanza");
    }

    if (!refrain.lineIds.length) {
      result.push(...stanza.lines);
    } else {
      const ids = new Set(refrain.lineIds.map((id) => id.toString()));

      result.push(
        ...stanza.lines.filter((line) => ids.has(line._id.toString())),
      );
    }
  }

  return result;
}

function validateMigration(original, migrated) {
  const reconstructed = reconstructSequence(migrated);

  if (reconstructed.length !== original.length) {
    throw new Error(
      `Sequence length mismatch: original=${original.length}, ` +
        `reconstructed=${reconstructed.length}`,
    );
  }

  const mismatches = [];

  for (let i = 0; i < original.length; i++) {
    const expected = original[i];
    const actual = reconstructed[i];

    for (const field of ["arab", "rom", "eng"]) {
      const originalValue = cleanText(expected[field]);
      const migratedValue = cleanText(actual[field]);

      if (
        normalizeForComparison(originalValue, field) !==
        normalizeForComparison(migratedValue, field)
      ) {
        mismatches.push({
          index: i,
          field,
          original: originalValue,
          migrated: migratedValue,
        });
      }
    }
  }

  if (mismatches.length > 0) {
    console.error("\nLYRIC MISMATCHES:");

    for (const mismatch of mismatches) {
      console.error(`\nLine ${mismatch.index + 1} (${mismatch.field}):`);
      console.error("  Original:", mismatch.original);
      console.error("  Migrated:", mismatch.migrated);
    }

    throw new Error(`${mismatches.length} lyric mismatches detected`);
  }
}

// -------------------------------------------
// Migrate one nasheed
// -------------------------------------------

function migrateNasheed(old) {
  const prepared = prepareOccurrences(old);

  if (prepared.errors.length) {
    throw new Error(prepared.errors.join("; "));
  }

  const config = getOverride(old);

  const definitions = getRefrainDefinitions(old, prepared.occurrences);

  const tokens = tokenizeSequence(prepared.occurrences, definitions);

  const stanzaSize = config.stanzaSize || 2;

  const grouped = groupIntoStanzas(tokens, stanzaSize);

  const document = buildV2(old, grouped);

  validateMigration(prepared.occurrences, document);

  const uniqueLines = document.stanzas.reduce(
    (sum, stanza) => sum + stanza.lines.length,
    0,
  );

  return {
    document,
    warnings: prepared.warnings,
    stats: {
      originalLines: prepared.occurrences.length,
      uniqueLines,
      stanzas: document.stanzas.length,
      refrains: document.refrains.length,
      sequenceEntries: document.sequence.length,
    },
  };
}

// -------------------------------------------
// Main migration
// -------------------------------------------

async function main() {
  let connected = false;

  try {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error("MONGODB_URI is missing");
    }

    await mongoose.connect(uri);
    connected = true;

    console.log("Connected to MongoDB");
    console.log(DRY_RUN ? "DRY RUN MODE" : "WRITE MODE");

    const oldNasheeds = await NasheedV1.find().lean();

    const summary = {
      mode: DRY_RUN ? "dry-run" : "write",
      total: oldNasheeds.length,
      validated: 0,
      migrated: 0,
      skipped: 0,
      failed: 0,
      warnings: 0,
    };

    for (const old of oldNasheeds) {
      try {
        const existing = await NasheedV2.exists({
          $or: [{ _id: old._id }, { arabTitle: old.arabTitle }],
        });

        if (existing) {
          console.log(`SKIP: ${old.engTitle} (already exists)`);

          summary.skipped++;
          continue;
        }

        const result = migrateNasheed(old);

        summary.validated++;

        console.log(`\n${old.engTitle}`);
        console.log(result.stats);

        for (const warning of result.warnings) {
          console.warn(`WARNING: ${warning}`);
          summary.warnings++;
        }

        if (WRITE) {
          await NasheedV2.create(result.document);
          summary.migrated++;
        }
      } catch (error) {
        summary.failed++;

        console.error(`FAILED: ${old.engTitle}`, error.message);
      }
    }

    console.log("\nMigration summary:");
    console.log(summary);

    if (summary.failed > 0) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error("Migration failed:", error);
    process.exitCode = 1;
  } finally {
    if (connected) {
      await mongoose.disconnect();
    }
  }
}

main();
