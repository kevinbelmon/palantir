import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BotonMusica } from "../src/ui/BotonMusica";

describe("el botón de la música", () => {
  it("cuando suena, ofrece silenciarla", () => {
    const html = renderToString(<BotonMusica silenciada={false} alAlternar={() => {}} />);
    expect(html).toContain("Silenciar la música");
    expect(html).toContain('aria-pressed="false"');
  });

  it("cuando está silenciada, ofrece volver a activarla", () => {
    const html = renderToString(<BotonMusica silenciada={true} alAlternar={() => {}} />);
    expect(html).toContain("Activar la música");
    expect(html).toContain('aria-pressed="true"');
  });
});
