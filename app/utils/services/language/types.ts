export type Language = string;

// A fordítási JSON-ok beágyazott objektumok (pl. { error: { notfound: { title: "..." } } }),
// ezért a Messages típusnak rekurzívan engednie kell a beágyazott kulcsokat is.
export type Messages = { [key: string]: string | Messages };
