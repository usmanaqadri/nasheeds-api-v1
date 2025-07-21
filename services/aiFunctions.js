const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.apiKey,
});

const generateTransliteration = async (req, res) => {
  const { arabicArr } = req.body;
  const arabicArrText = arabicArr.join("_newLine_");

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      store: true,
      messages: [
        {
          role: "user",
          content: `You will be given a piece of Arabic text with "_newLine_" markers. Please produce an academic transliteration of the Arabic.

IMPORTANT:
- Wherever you see "_newLine_", insert an actual newline (line break).
- Do not output the string "\\n" or the word "_newLine_".
- Output only the transliteration — no introductions or explanations.
- Put the final voweling/haraka on the word. For example يا نَبِيَّ الْهُدَى  should transliterate to Yā Nabiyya l-Hudā
- Make sure each line begins with a capital letter, Don't capitalize every word unless it's a title or a name of God.

Here is the Arabic:
${arabicArrText}`,
        },
      ],
    });

    return res
      .status(200)
      .json({ transliteration: response.choices[0].message.content });
  } catch (error) {
    console.error("Failure to generate transliteration", error);
    return res.status(500).json({ message: error.message });
  }
};

const generateTranslation = async (req, res) => {
  const { arabicArr } = req.body;
  const arabicArrText = arabicArr.join("_newLine_");

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      store: true,
      messages: [
        {
          role: "user",
          content: `You will be given a piece of Arabic text with "_newLine_" markers. Please produce a faithful English translation of the Arabic.

IMPORTANT:
- Wherever you see "_newLine_", insert an actual newline (line break).
- Do not output the string "\\n" or the word "_newLine_".
- Output only the translation — no introductions or explanations.
- Make sure thr translation is properly punctuated. 
- Some context is that this is devotional Islamic poetry. 

Here is the Arabic:
${arabicArrText}`,
        },
      ],
    });

    return res
      .status(200)
      .json({ translation: response.choices[0].message.content });
  } catch (error) {
    console.error("Failure to generate translation", error);
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { generateTransliteration, generateTranslation };
