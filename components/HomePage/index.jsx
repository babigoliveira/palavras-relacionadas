import styles from "./HomePage.module.css";
import { useState } from "react";
import axios from "axios";

const HomePage = () => {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchCount, setSearchCount] = useState(0);
  const [relatedWords, setRelatedWords] = useState([]);

  const handleFormSubmit = (event) => {
    event.preventDefault();
    findRelatedWords(search);
  };

  const findRelatedWords = (word) => {
    setLoading(true);
    setSearchCount(searchCount + 1);

    axios
      .get("/api/find-related-words", { params: { q: word } })
      .then((response) => setRelatedWords(response.data))
      .finally(() => setLoading(false));
  };

  const handleWordClick = (relatedWord) => {
    setSearch(relatedWord);
    findRelatedWords(relatedWord);
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleFormSubmit} className={styles.form}>
        <input
          type="text"
          placeholder="Buscar uma palavra"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button disabled={search.trim().length === 0} type="submit">
          Buscar
        </button>
      </form>

      {loading && <p className={styles.status}>Aguarde um momento...</p>}

      {!loading && relatedWords.length === 0 && searchCount > 0 && (
        <p className={styles.status}>Nenhuma palavra relacionada encontrada</p>
      )}

      {!loading && (
        <ul className={styles.words}>
          {relatedWords.map((relatedWord) => (
            <li key={relatedWord} onClick={() => handleWordClick(relatedWord)}>
              {relatedWord}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default HomePage;
