import { adminDb } from '../firebase/index.server';
import { Constructor } from '../firebase/constructor-types';
import { FieldValue } from 'firebase-admin/firestore';

export class ConstructorRepository {
  private collection = adminDb.collection('constructors');

  async getById(id: string): Promise<Constructor | null> {
    const doc = await this.collection.doc(id).get();
    return doc.exists ? ({ id: doc.id, ...doc.data() } as Constructor) : null;
  }

  async create(data: { name: string, ownerId: string }): Promise<string> {
    const newConstructor: Omit<Constructor, 'id'> = {
      name: data.name,
      ownerId: data.ownerId,
      members: [{ uid: data.ownerId, role: 'admin' }]
    };
    const docRef = await this.collection.add(newConstructor);
    return docRef.id;
  }

  async update(id: string, data: Partial<Constructor>): Promise<void> {
    await this.collection.doc(id).update(data);
  }

  async addMember(constructorId: string, member: { uid: string, role: Constructor['members'][0]['role'] }): Promise<void> {
    await this.collection.doc(constructorId).update({
      members: FieldValue.arrayUnion(member)
    });
  }

  async removeMember(constructorId: string, uid: string): Promise<void> {
    const docRef = this.collection.doc(constructorId);
    const doc = await docRef.get();
    if (!doc.exists) return;
    
    const constructor = doc.data() as Constructor;
    const updatedMembers = constructor.members.filter(m => m.uid !== uid);
    
    await docRef.update({ members: updatedMembers });
  }
}
