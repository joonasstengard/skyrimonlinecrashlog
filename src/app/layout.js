"use client";

import { Analytics } from "@vercel/analytics/react";
import React, { useEffect, useState } from "react";
import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

const imageArray = [
  "lichimg.png",
  "dwarfimg.png",
  "spiderimg.png",
  "dreadimg.png",
  "taloimg.png",
  "taloimg.png",
  "whiterunimg.png",
  "hrothimg.png",
  "hrothimg.png",
  "hrothimg.png",
  //more images can be added here as the background image is randomized between these
];

export default function RootLayout({ children }) {
  const [backgroundImage, setBackgroundImage] = useState("");

  useEffect(() => {
    const getRandomImage = () => {
      const randomIndex = Math.floor(Math.random() * imageArray.length);
      return imageArray[randomIndex];
    };

    setBackgroundImage(getRandomImage());
  }, []);

  return (
    <html lang="en">
      <body
        className={`${inter.className} bg-image`}
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center top",
        }}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
