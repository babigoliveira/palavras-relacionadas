const url = require("url");
const axios = require("axios");
const cheerio = require("cheerio");

const findRelatedWords = async (word) => {
  const url = "https://dicionariocriativo.com.br/" + word;
  const response = await axios.get(url);
  const html = response.data;
  const $ = cheerio.load(html);

  const relatedWords = [];

  $(".resumoBoxContent .tags a").each((_idx, el) => {
    const relatedWord = $(el).text();
    if (relatedWord !== word) {
      relatedWords.push(relatedWord);
    }
  });

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
