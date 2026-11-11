require("dotenv").config();

const mongoose = require("mongoose");

const NasheedV2 = require("../models/nasheed_v2");
const Collection = require("../models/collection");

async function main() {
  const [nasheedSlug, collectionSlug] = process.argv.slice(2);

  if (!nasheedSlug || !collectionSlug) {
    console.error(
      'Usage: node scripts/addNasheedToCollection.js "Nasheed Title" collection-slug',
    );
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Find the nasheed
    const nasheed = await NasheedV2.findOne({
      slug: nasheedSlug,
    });

    if (!nasheed) {
      throw new Error(`Nasheed not found: ${nasheedSlug}`);
    }

    // Find the collection
    const collection = await Collection.findOne({
      slug: collectionSlug,
    });

    if (!collection) {
      throw new Error(`Collection not found: ${collectionSlug}`);
    }

    // Add the collection without creating duplicates
    const result = await NasheedV2.updateOne(
      { _id: nasheed._id },
      {
        $addToSet: {
          collections: collection._id,
        },
      },
    );

    if (result.modifiedCount === 0) {
      console.log("Nasheed already belongs to this collection.");
    } else {
      console.log("Successfully associated nasheed with collection.");
    }

    console.log(`Nasheed: ${nasheed.engTitle}`);
    console.log(`Collection: ${collection.name}`);
  } catch (error) {
    console.error("Error:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main();
