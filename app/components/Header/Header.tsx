import Link from "next/link";
import "./Header.scss";

export default function Header() {
  return (
    <header className="header">
      <div className="header-container">

        <div className="logo">
          ChatBot
        </div>

       <Link href="/chat" className="header-button">
         Try Chatbot
       </Link>

      </div>
    </header>
  );
}