const url = require("url");
const puppeteer = require("puppeteer");

const findRelatedWords = async (word) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("https://dicionariocriativo.com.br/" + word);

  const relatedWords = await page.evaluate((word) => {
    const relatedWordsLinks = document.querySelectorAll(
      ".resumoBoxContent .tags a"
    );

    return Array.from(relatedWordsLinks)
      .map((el) => el.innerHTML)
      .filter((relatedWord) => relatedWord !== word);
  }, word);

  await browser.close();
  return relatedWords;
};

const removeDuplicates = (list) => Array.from(new Set(list));

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').OutgoingMessage} res
 **/
const handleHttpRequest = async (req, res) => {
  const queryParams = url.parse(req.url, true).query;
  const word = queryParams["q"];
  const relatedWords = await findRelatedWords(word);
  const deduplicatedRelatedWords = removeDuplicates(relatedWords);
  res.status(200).json(deduplicatedRelatedWords.sort());
};

export default handleHttpRequest;
