import os
import faiss
import pickle
import numpy as np
from sentence_transformers import SentenceTransformer
from flask import current_app

class RAGService:
    _instance = None
    
    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.dimension = 384
        self.index = faiss.IndexFlatL2(self.dimension)
        self.documents = [] # List of dicts: {'id': int, 'text': str, 'source': str}
        self.vector_store_path = current_app.config['VECTOR_STORE_PATH']
        
        if not os.path.exists(self.vector_store_path):
            os.makedirs(self.vector_store_path)
            
        self.load_index()

    def add_document(self, doc_id, text, source):
        # Split text into chunks if needed, for now simple document level
        if not text.strip():
            return
            
        vector = self.model.encode([text])
        self.index.add(vector.astype('float32'))
        self.documents.append({'id': doc_id, 'text': text, 'source': source})
        self.save_index()

    def search(self, query, k=3):
        vector = self.model.encode([query])
        distances, indices = self.index.search(vector.astype('float32'), k)
        
        results = []
        for i, idx in enumerate(indices[0]):
            if idx != -1 and idx < len(self.documents):
                results.append({
                    'document': self.documents[idx],
                    'distance': float(distances[0][i])
                })
        return results

    def save_index(self):
        faiss.write_index(self.index, os.path.join(self.vector_store_path, 'index.faiss'))
        with open(os.path.join(self.vector_store_path, 'docs.pkl'), 'wb') as f:
            pickle.dump(self.documents, f)

    def load_index(self):
        index_file = os.path.join(self.vector_store_path, 'index.faiss')
        docs_file = os.path.join(self.vector_store_path, 'docs.pkl')
        
        if os.path.exists(index_file) and os.path.exists(docs_file):
            self.index = faiss.read_index(index_file)
            with open(docs_file, 'rb') as f:
                self.documents = pickle.load(f)
