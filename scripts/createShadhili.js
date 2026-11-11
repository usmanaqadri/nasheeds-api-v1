require("dotenv").config();

const mongoose = require("mongoose");
const Collection = require("../models/collection");

async function main() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in .env");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const collectionData = {
      name: "Shadhili",
      slug: "shadhili",
      type: "tariqa",

      description:
        "The Shadhiliyya is a Sufi tariqa founded by Abu al-Hasan al-Shadhili.",

      history:
        "The Shadhiliyya emerged in the 13th century under Abu al-Hasan al-Shadhili (d. 1258). It developed in North Africa and Egypt and subsequently spread to other regions of the Muslim world.",

      founder: "Abu al-Hasan al-Shadhili",
      origin: "North Africa",
      imageUrl: "",
    };

    // Find existing collection or create a new one
    const existing = await Collection.findOne({
      slug: collectionData.slug,
    });

    if (existing) {
      console.log("Shadhili collection already exists.");
      console.log("Collection ID:", existing._id.toString());
      return;
    }

    const collection = await Collection.create(collectionData);

    console.log("Successfully created Shadhili collection!");
    console.log("Collection ID:", collection._id.toString());
    console.log("Name:", collection.name);
    console.log("Slug:", collection.slug);
  } catch (error) {
    console.error("Error:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main();
