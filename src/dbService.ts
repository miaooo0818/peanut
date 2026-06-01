import {
  collection,
  getDocs,
  getDoc,
  setDoc,
  doc,
  query,
  where,
  orderBy,
  addDoc,
  deleteDoc
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType, sha256 } from "./firebase";
import { Product, Order, OrderItem } from "./types";
import { DEFAULT_PRODUCTS } from "./defaultProducts";

// Helper to generate readable SNH order numbers: SNH-YYYYMMDD-XXXX
function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const dateStr = `${year}${month}${day}`;
  const randomStr = Math.floor(1000 + Math.random() * 9000).toString(); // 4 digits
  return `SNH-${dateStr}-${randomStr}`;
}

/**
 * Seed the products in the Firebase store if none exist.
 */
export async function seedProductsIfEmpty(): Promise<Product[]> {
  const collectionName = "products";
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    if (querySnapshot.empty) {
      // Seed default products
      for (const prod of DEFAULT_PRODUCTS) {
        await setDoc(doc(db, collectionName, prod.id), prod);
      }
      return DEFAULT_PRODUCTS;
    } else {
      const list: Product[] = [];
      querySnapshot.forEach((document) => {
        list.push({ ...document.data(), id: document.id } as Product);
      });
      return list.sort((a, b) => {
        const orderA = a.sortOrder !== undefined ? a.sortOrder : 999;
        const orderB = b.sortOrder !== undefined ? b.sortOrder : 999;
        return orderA - orderB;
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, collectionName);
    return DEFAULT_PRODUCTS; // Fallback
  }
}

/**
 * Get all available products from Firestore.
 */
export async function getAllProducts(): Promise<Product[]> {
  const collectionName = "products";
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    const list: Product[] = [];
    querySnapshot.forEach((document) => {
      list.push({ ...document.data(), id: document.id } as Product);
    });
    return list.sort((a, b) => {
      const orderA = a.sortOrder !== undefined ? a.sortOrder : 999;
      const orderB = b.sortOrder !== undefined ? b.sortOrder : 999;
      return orderA - orderB;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, collectionName);
    return [];
  }
}

/**
 * Save or update a product.
 */
export async function saveProduct(product: Product): Promise<void> {
  const collectionName = "products";
  try {
    await setDoc(doc(db, collectionName, product.id), product);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${collectionName}/${product.id}`);
  }
}

/**
 * Delete a product.
 */
export async function deleteProduct(productId: string): Promise<void> {
  const collectionName = "products";
  try {
    await deleteDoc(doc(db, collectionName, productId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${productId}`);
  }
}

/**
 * Create a new Customer Order in Firestore.
 */
export async function createOrder(orderData: Omit<Order, "id" | "orderNumber" | "createdAt" | "updatedAt">): Promise<Order> {
  const collectionName = "orders";
  const orderNumber = generateOrderNumber();
  const now = new Date().toISOString();
  
  try {
    const newDocRef = doc(collection(db, collectionName));
    const fullOrder: Order = {
      ...orderData,
      id: newDocRef.id,
      orderNumber,
      createdAt: now,
      updatedAt: now
    };
    await setDoc(newDocRef, fullOrder);
    return fullOrder;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, collectionName);
    throw error;
  }
}

/**
 * Retrieve all orders ordered by creation date desc (Admin utility).
 */
export async function getAllOrders(): Promise<Order[]> {
  const collectionName = "orders";
  try {
    const q = query(collection(db, collectionName), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const list: Order[] = [];
    querySnapshot.forEach((document) => {
      list.push({ ...document.data() } as Order);
    });
    return list;
  } catch (error) {
    // If orderby falls back because indexes are building, try standard fetch
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      const list: Order[] = [];
      querySnapshot.forEach((document) => {
        list.push({ ...document.data() } as Order);
      });
      return list.sort((a,b) => b.createdAt.localeCompare(a.createdAt));
    } catch (e) {
      handleFirestoreError(error, OperationType.GET, collectionName);
      return [];
    }
  }
}

/**
 * Update the status of an order.
 */
export async function updateOrderStatus(orderId: string, status: Order["status"]): Promise<void> {
  const collectionName = "orders";
  try {
    const orderDocRef = doc(db, collectionName, orderId);
    const orderDoc = await getDoc(orderDocRef);
    if (orderDoc.exists()) {
      await setDoc(
        orderDocRef,
        {
          status,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${collectionName}/${orderId}`);
  }
}

/**
 * Find orders by Customer Name and Phone.
 */
export async function findOrdersByCustomer(name: string, phone: string): Promise<Order[]> {
  const collectionName = "orders";
  try {
    const q = query(
      collection(db, collectionName),
      where("customerName", "==", name.trim()),
      where("customerPhone", "==", phone.trim())
    );
    const querySnapshot = await getDocs(q);
    const list: Order[] = [];
    querySnapshot.forEach((document) => {
      list.push(document.data() as Order);
    });
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, collectionName);
    return [];
  }
}

/**
 * Look up order by Order Number.
 */
export async function findOrderByNumber(orderNumber: string): Promise<Order | null> {
  const collectionName = "orders";
  try {
    const q = query(collection(db, collectionName), where("orderNumber", "==", orderNumber.trim()));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data() as Order;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, collectionName);
    return null;
  }
}

/**
 * Check if the admin config password has been set up.
 */
export async function checkAdminPasswordSetup(): Promise<boolean> {
  const collectionName = "config";
  const docId = "admin";
  try {
    const configDoc = await getDoc(doc(db, collectionName, docId));
    if (configDoc.exists()) {
      const data = configDoc.data();
      return !!data.passwordHash;
    }
    return false;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${collectionName}/${docId}`);
    return false;
  }
}

/**
 * Sets the admin password hash.
 */
export async function setupAdminPassword(password: string): Promise<void> {
  const collectionName = "config";
  const docId = "admin";
  try {
    const passwordHash = await sha256(password);
    await setDoc(doc(db, collectionName, docId), {
      passwordHash,
      isSetup: true,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${collectionName}/${docId}`);
  }
}

/**
 * Verify whether an entered password matches the stored admin password.
 */
export async function verifyAdminPassword(password: string): Promise<boolean> {
  const collectionName = "config";
  const docId = "admin";
  try {
    const configDoc = await getDoc(doc(db, collectionName, docId));
    if (configDoc.exists()) {
      const data = configDoc.data();
      const inputHash = await sha256(password);
      return data.passwordHash === inputHash;
    }
    return false;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${collectionName}/${docId}`);
    return false;
  }
}
