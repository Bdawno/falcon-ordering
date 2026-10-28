export function parseMenuItemInput(body: unknown) {
  const { name, description, price } = (body ?? {}) as {
    name?: unknown;
    description?: unknown;
    price?: unknown;
  };

  const parsedPrice = typeof price === "string" ? Number(price) : price;
  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof parsedPrice !== "number" ||
    !Number.isFinite(parsedPrice) ||
    parsedPrice < 0 ||
    (description !== undefined && description !== null && typeof description !== "string")
  ) {
    return null;
  }

  return {
    name: name.trim(),
    description: typeof description === "string" && description.trim() ? description.trim() : null,
    price: Math.round(parsedPrice * 100) / 100,
  };
}
