import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri"

export default function Home() {
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    void (async () => {
      const text = await invoke('greet', { name: 'World' }) as string;
      setGreeting(text);
    })();
  }, []);

  return (
    <p>{greeting}</p>
  );
}