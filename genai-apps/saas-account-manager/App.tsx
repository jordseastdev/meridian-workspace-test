import { useState } from "react";
import { AccountWorkspace } from "./AccountWorkspace";
import "./styles.css";

export default function App() {
  const [notice, setNotice] = useState("");
  return <AccountWorkspace notice={notice} setNotice={setNotice} />;
}