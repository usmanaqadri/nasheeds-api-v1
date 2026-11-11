require("dotenv").config();

const mongoose = require("mongoose");
const NasheedV2 = require("../models/nasheed_v2");
const slugify = require("../utils/slugify");

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const nasheeds = await NasheedV2.find();

    const usedSlugs = new Set(nasheeds.map((n) => n.slug).filter(Boolean));

    for (const nasheed of nasheeds) {
      if (nasheed.slug) {
        console.log(`SKIP: ${nasheed.engTitle}`);
        continue;
      }

      const baseSlug = slugify(nasheed.engTitle);

      if (!baseSlug) {
        throw new Error(`Could not generate slug for ${nasheed.engTitle}`);
      }

      let slug = baseSlug;
      let suffix = 2;

      while (usedSlugs.has(slug)) {
        slug = `${baseSlug}-${suffix}`;
        suffix++;
      }

      nasheed.slug = slug;
      await nasheed.save();

      usedSlugs.add(slug);

      console.log(`${nasheed.engTitle} → ${slug}`);
    }

    console.log("Finished adding nasheed slugs.");
  } catch (error) {
    console.error("Error:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main();
