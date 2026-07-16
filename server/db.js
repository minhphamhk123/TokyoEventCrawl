import fs from 'fs/promises';
import path from 'path';

const DB_DIR = path.resolve('./data');

class Collection {
  constructor(name) {
    this.filePath = path.join(DB_DIR, `${name}.json`);
  }

  async read() {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      // If directory or file doesn't exist, initialize with empty array
      await fs.mkdir(DB_DIR, { recursive: true });
      await fs.writeFile(this.filePath, JSON.stringify([]));
      return [];
    }
  }

  async write(data) {
    await fs.mkdir(DB_DIR, { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(data, null, 2));
  }

  async find(query = {}) {
    const docs = await this.read();
    return docs.filter(doc => {
      for (const key in query) {
        if (Array.isArray(query[key])) {
          if (!Array.isArray(doc[key]) || doc[key].length !== query[key].length || !doc[key].every((v, i) => v === query[key][i])) {
            return false;
          }
        } else if (doc[key] !== query[key]) {
          return false;
        }
      }
      return true;
    });
  }

  async findOne(query = {}) {
    const docs = await this.read();
    return docs.find(doc => {
      for (const key in query) {
        if (doc[key] !== query[key]) return false;
      }
      return true;
    }) || null;
  }

  async insert(doc) {
    const docs = await this.read();
    const newDoc = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
      createdAt: new Date().toISOString(),
      ...doc
    };
    docs.push(newDoc);
    await this.write(docs);
    return newDoc;
  }

  async update(query, updateData) {
    const docs = await this.read();
    let updatedCount = 0;
    const newDocs = docs.map(doc => {
      let matches = true;
      for (const key in query) {
        if (doc[key] !== query[key]) matches = false;
      }
      if (matches) {
        updatedCount++;
        return { ...doc, ...updateData, updatedAt: new Date().toISOString() };
      }
      return doc;
    });
    await this.write(newDocs);
    return updatedCount;
  }

  async delete(query) {
    const docs = await this.read();
    let deletedCount = 0;
    const newDocs = docs.filter(doc => {
      let matches = true;
      for (const key in query) {
        if (doc[key] !== query[key]) matches = false;
      }
      if (matches) {
        deletedCount++;
        return false;
      }
      return true;
    });
    await this.write(newDocs);
    return deletedCount;
  }
}

export const db = {
  settings: new Collection('settings'),
  events: new Collection('events')
};
