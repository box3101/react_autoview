import React, { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [urls, setUrls] = useState([]);
  const [newUrl, setNewUrl] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [viewCounts, setViewCounts] = useState({});
  const [intervalId, setIntervalId] = useState(null);

  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  const addUrl = () => {
    if (newUrl && !urls.includes(newUrl)) {
      setUrls([...urls, newUrl]);
      setViewCounts(prev => ({ ...prev, [newUrl]: 0 }));
      setNewUrl("");
    }
  };
  
  const startViewing = () => {
    if (isRunning) return;

    const id = setInterval(() => {
      urls.forEach(increaseViewCount);
    }, 180000); // 3분마다 실행

    setIntervalId(id);
    setIsRunning(true);
  }; 

  const stopViewing = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
      setIsRunning(false);
    }
  };

  const increaseViewCount = async (url) => {
    try {
      await axios.get(`http://localhost:3001/visit?url=${encodeURIComponent(url)}`);
      setViewCounts(prev => ({ ...prev, [url]: prev[url] + 1 }));
      console.log(`조회수 증가: ${url}`);
    } catch (error) {
      console.error('에러 발생:', error);
    }
  };

  return (
    <div className="App">
      <h1>블로그 뷰 부스터</h1>
      <input
        type="text"
        placeholder="블로그 주소를 입력하세요"
        value={newUrl}
        onChange={(e) => setNewUrl(e.target.value)}
      />
      <button onClick={addUrl}>URL 추가</button>
      <button onClick={isRunning ? stopViewing : startViewing}>
        {isRunning ? "중지" : "시작"}
      </button>
      <ul>
        {urls.map(url => (
          <li key={url}>
            {url}: {viewCounts[url]} 조회
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;