export type Product = {
  id: string;
  name: string;
  category?: string;
  // reference to categories collection (ObjectId hex string)
  categoryId?: string;
  sku?: string;
  stock: number;
  // number of items currently reserved (not yet finalized)
  reserved?: number;
  price?: number;
  // Optional image URL for product thumbnail
  imageUrl?: string;
  // If the image is stored in Mongo GridFS, this is the file id (hex)
  imageId?: string;
  // list of product features (e.g., fragrance notes)
  features?: string[];
  // additional free-form description
  extraDescription?: string;
  // special-offer discount percentage (0-100), managed from the admin panel
  discount?: number;
  // when true, the product is featured in the homepage "special offers" section
  specialOffer?: boolean;
  createdAt?: string;
};
