import dynamic from "next/dynamic";
import styles from "./HomePage.module.css";
import { useState, useEffect } from "react";
import axios from "axios";
import cytoscape from "cytoscape";

const CytoscapeComponent = dynamic(() => import("react-cytoscapejs"), {
  ssr: false,
});

const generateEdgeId = (node1Label, node2Label) => {
  return `edge-${[node1Label, node2Label].sort().join("-")}`;
};

const heatMapColorforValue = (value) => {
  var h = (1.0 - value) * 240;
  return "hsl(" + h + ", 100%, 50%)";
};

const HomePage = () => {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchCount, setSearchCount] = useState(0);
  const [relatedWords, setRelatedWords] = useState([]);
  const [graph, setGraph] = useState(cytoscape());
  const [elements, setElements] = useState([]);
  const [maxEdges, setMaxEdges] = useState(1);

  const handleFormSubmit = (event) => {
    event.preventDefault();
    setElements([]);
    findRelatedWords(search);
  };

  const updateGraph = (rootWord, relatedWords) => {
    const newNodes = [rootWord, ...relatedWords]
      .filter((word) => !graph.getElementById(word).data())
      .map((word) => ({
        group: "nodes",
        data: {
          id: word,
          name: word,
          label: word,
        },
      }));

    const newEdges = relatedWords
      .filter(
        (word) => !graph.getElementById(generateEdgeId(rootWord, word)).data()
      )
      .map((word) => ({
        group: "edges",
        data: {
          id: generateEdgeId(rootWord, word),
          source: rootWord,
          target: word,
        },
      }));

    if (newEdges.length) {
      setElements((elements) => [...elements, ...newNodes, ...newEdges]);
    }

    setMaxEdges((currentMax) => Math.max(currentMax, newEdges.length));
  };

  const findRelatedWords = (word) => {
    setLoading(true);
    setSearchCount((currentCount) => currentCount + 1);

    axios
      .get("/api/find-related-words", {
        params: { q: word, limit: 15 },
      })
      .then((response) => {
        const relatedWords = response.data;

        setRelatedWords(relatedWords);

        if (relatedWords.length) {
          updateGraph(word, relatedWords);
        }
      })
      .finally(() => setLoading(false));
  };

  const handleWordClick = (relatedWord) => {
    setSearch(relatedWord);
    findRelatedWords(relatedWord);
  };

  const handleNodeClick = (node) => {
    const nodeWord = node.data().name;
    handleWordClick(nodeWord);
  };

  useEffect(() => {
    graph.style(
      cytoscape
        .stylesheet()
        .selector("node")
        .css({
          content: "data(name)",
          "text-valign": "center",
          color: "white",
          "text-outline-width": 2,
          "text-outline-color": "#888",
          "background-color": (node) => {
            const nodeDegree = node.connectedEdges().size();
            const nodeColorWeight = nodeDegree / maxEdges;
            const nodeColor = heatMapColorforValue(nodeColorWeight);
            return nodeColor;
          },
        })
        .selector(":selected")
        .css({
          "background-color": "red",
          "line-color": "red",
          "target-arrow-color": "red",
          "source-arrow-color": "red",
          "text-outline-color": "red",
        })
    );
    graph
      .layout({
        name: "cose",
        animate: true,
      })
      .run();
  }, [elements]);

  useEffect(() => {
    if (!graph) {
      return;
    }

    graph.on("tap", "node", function () {
      handleNodeClick(this);
    });

    graph.style(
      cytoscape
        .stylesheet()
        .selector("node")
        .css({
          content: "data(name)",
          "text-valign": "center",
          color: "white",
          "text-outline-width": 2,
          "text-outline-color": "#888",
          "background-color": "#888",
        })
        .selector(":selected")
        .css({
          "background-color": "red",
          "line-color": "red",
          "target-arrow-color": "red",
          "source-arrow-color": "red",
          "text-outline-color": "red",
        })
    );
  }, [graph]);

  const statusMessage = loading
    ? "Aguarde um momento..."
    : relatedWords.length === 0 && searchCount > 0
    ? "Nenhuma palavra relacionada encontrada"
    : "";

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Grafo de palavras</h1>
      <form onSubmit={handleFormSubmit} className={styles.form}>
        <input
          type="text"
          placeholder="Digite uma palavra"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button disabled={search.trim().length === 0} type="submit">
          Buscar
        </button>
      </form>

      <section>
        <p
          className={styles.status}
          style={{ visibility: statusMessage ? "visible" : "hidden" }}
        >
          {statusMessage}
        </p>
      </section>

      <CytoscapeComponent
        elements={elements}
        wheelSensitivity={0.1}
        cy={(cy) => {
          setGraph(cy);
        }}
        className={styles.graph}
        style={{ height: "400px" }}
      />
    </div>
  );
};

export default HomePage;
