
import Image from "next/image";
import heroBanner from "../../assets/chatbotheroImg.png";
import GoogleLogin from "../GoogleLogin/GoogleLogin";
import "./Hero.scss";

export default function Hero() {
  return (
    <section className="hero">

      <div className="hero-banner">
        <Image
          src={heroBanner}
          alt="AI Chatbot"
          fill
          preload
          sizes="(max-width: 991px) max(100vw, 111vh, 925px), max(100vw, 201vh)"
          placeholder="blur"
        />
      </div>

      <div className="hero-content">

        <h1>
          Hi! I&apos;m ChatBot 👋
        </h1>

        <p>
          Your smart AI assistant is here to help you.
          Login with Google to start chatting with AI.
        </p>

        <div className="hero-buttons">
          <GoogleLogin />
        </div>

      </div>

    </section>
  );
}
