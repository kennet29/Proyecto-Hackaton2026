import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

type StoreProduct = {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
};

type CartLine = {
  product: StoreProduct;
  qty: number;
};

@Component({
  selector: 'app-nano-store',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nano-store.component.html',
  styleUrls: ['./nano-store.component.css']
})
export class NanoStoreComponent {
  readonly allLabel = 'Todos';

  @Input() customProducts: StoreProduct[] | null = null;
  @Input() imageFolder = 'tienda';
  @Input() whatsappNumber = '50558736951';
  @Input() storeName = 'Nica Prime';

  readonly nanoProducts: StoreProduct[] = [
    { id: 'gorras', name: 'Gorras Nano', category: 'Ropa', price: 150, image: 'gorras' },
    { id: 'gorro-nano', name: 'Gorro Nano', category: 'Ropa', price: 170, image: 'gorro-nano' },
    { id: 'producto-04', name: 'Totebag Nano', category: 'Más productos', price: 120, image: 'producto-04' },
    { id: 'producto-09', name: 'Bandas Nano', category: 'Más productos', price: 110, image: 'producto-09' },
    { id: 'producto-03', name: 'Camisetas Nano', category: 'Más productos', price: 180, image: 'producto-03' },
    { id: 'hoodie', name: 'Hoodie Nica Prime', category: 'Ropa', price: 0, image: 'hoodie' },
    { id: 'uniformes', name: 'Uniformes Nano', category: 'Ropa', price: 0, image: 'uniformes' },
    { id: 'botella', name: 'Botella Nano', category: 'Accesorios', price: 0, image: 'botella' },
    { id: 'pulsera', name: 'Pulsera de silicón', category: 'Accesorios', price: 0, image: 'pulsera' },
    { id: 'broche', name: 'Broche Nano', category: 'Accesorios', price: 0, image: 'broche' },
    { id: 'almohada', name: 'Almohada Nano', category: 'Accesorios', price: 0, image: 'almohada' },
    { id: 'calendario', name: 'Calendario de salud', category: 'Papelería', price: 0, image: 'calendario' },
    { id: 'nano-chef', name: 'Nano Chef', category: 'Colección Nano', price: 0, image: 'nano-chef' },
    { id: 'producto-01', name: 'Taza Nano', category: 'Más productos', price: 0, image: 'producto-01' },
    { id: 'producto-02', name: 'Stickers Nano', category: 'Más productos', price: 0, image: 'producto-02' },
    { id: 'producto-05', name: 'Toalla Nano', category: 'Más productos', price: 0, image: 'producto-05' },
    { id: 'producto-06', name: 'Calsetas Nano', category: 'Más productos', price: 0, image: 'producto-06' },
    { id: 'producto-07', name: 'Artículo Nano 07', category: 'Más productos', price: 0, image: 'producto-07' },
    { id: 'producto-08', name: 'Libro Nano', category: 'Más productos', price: 0, image: 'producto-08' },
   
  ];

  get products(): StoreProduct[] {
    return this.customProducts ?? this.nanoProducts;
  }

  get categories(): string[] {
    return [this.allLabel, ...Array.from(new Set(this.products.map((p) => p.category)))];
  }

  selectedCategory = this.allLabel;
  cart: CartLine[] = [];
  isCartOpen = false;
  orderPlaced = false;

  get visibleProducts(): StoreProduct[] {
    return this.selectedCategory === this.allLabel
      ? this.products
      : this.products.filter((p) => p.category === this.selectedCategory);
  }

  get cartCount(): number {
    return this.cart.reduce((sum, line) => sum + line.qty, 0);
  }

  get cartTotal(): number {
    return this.cart.reduce((sum, line) => sum + line.qty * line.product.price, 0);
  }

  imageUrl(product: StoreProduct): string {
    return `assets/${this.imageFolder}/${product.image}.jpg`;
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
  }

  addToCart(product: StoreProduct): void {
    if (product.price <= 0) {
      return;
    }
    const line = this.cart.find((l) => l.product.id === product.id);
    if (line) {
      line.qty += 1;
    } else {
      this.cart.push({ product, qty: 1 });
    }
    this.orderPlaced = false;
    this.isCartOpen = true;
  }

  changeQty(line: CartLine, delta: number): void {
    line.qty += delta;
    if (line.qty <= 0) {
      this.cart = this.cart.filter((l) => l !== line);
    }
  }

  clearCart(): void {
    this.cart = [];
  }

  toggleCart(): void {
    this.isCartOpen = !this.isCartOpen;
  }

  customerName = '';
  customerPhone = '';
  showErrors = false;

  get customerValid(): boolean {
    return this.customerName.trim().length > 1 && this.customerPhone.replace(/\D/g, '').length >= 8;
  }

  checkout(): void {
    if (!this.cart.length) {
      return;
    }
    if (!this.customerValid) {
      this.showErrors = true;
      return;
    }
    const lines = this.cart.map(
      (l) => `- ${l.product.name} x${l.qty} — C$ ${l.qty * l.product.price}`
    );
    const message = `Hola ${this.storeName}, quiero hacer este pedido:\nCliente: ${this.customerName.trim()}\nCelular: ${this.customerPhone.trim()}\n${lines.join('\n')}\nTotal: C$ ${this.cartTotal}`;
    window.open(
      `https://wa.me/${this.whatsappNumber}?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener'
    );
    this.cart = [];
    this.showErrors = false;
    this.orderPlaced = true;
  }
}
