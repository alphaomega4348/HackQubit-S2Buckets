import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import logo from "./assets/logo.png";

// set favicon at runtime using imported asset (works in dev and production)
const setFavicon = (url) => {
	let link = document.querySelector("link[rel~='icon']");
	if (!link) {
		link = document.createElement('link');
		link.rel = 'icon';
		document.getElementsByTagName('head')[0].appendChild(link);
	}
	link.href = url;
};

setFavicon(logo);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
