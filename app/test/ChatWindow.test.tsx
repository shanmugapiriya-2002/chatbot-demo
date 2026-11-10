import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ChatWindow from "../components/ChatWindow/ChatWindow";

describe("ChatWindow Component Testing", () => {

  test("ChatWindow should render successfully", () => {
    // render(<ChatWindow />);

    expect(
      screen.getByText("value")
    ).toBeInTheDocument();
  });

});