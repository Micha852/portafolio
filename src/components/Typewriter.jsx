"use client";

import { useEffect, useState } from "react";

// Escribe y borra cada frase en bucle
export default function Typewriter({ phrases }) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = phrases[index % phrases.length];
    let delay = deleting ? 35 : 70;

    if (!deleting && text === current) delay = 1800;
    else if (deleting && text === "") delay = 300;

    const timeout = setTimeout(() => {
      if (!deleting && text === current) {
        setDeleting(true);
      } else if (deleting && text === "") {
        setDeleting(false);
        setIndex((i) => i + 1);
      } else {
        setText(current.slice(0, text.length + (deleting ? -1 : 1)));
      }
    }, delay);

    return () => clearTimeout(timeout);
  }, [text, deleting, index, phrases]);

  return (
    <span>
      {text}
      <span className="animate-blink text-accent">|</span>
    </span>
  );
}
