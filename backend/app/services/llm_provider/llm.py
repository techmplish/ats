import os
import google.generativeai as genai
from openai import OpenAI
from flask import current_app

class LLMProvider:
    def __init__(self, provider=None):
        self.provider = provider or current_app.config['LLM_PROVIDER']
        self.gemini_key = current_app.config['GEMINI_API_KEY']
        self.openai_key = current_app.config['OPENAI_API_KEY']
        
        if self.provider == 'gemini':
            genai.configure(api_key=self.gemini_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
        elif self.provider == 'openai':
            self.client = OpenAI(api_key=self.openai_key)
        
    def chat(self, messages: list[dict], max_tokens=800):
        """
        Unified chat interface.
        messages: list of dicts with 'role' ('user', 'system', 'assistant') and 'content'.
        """
        if self.provider == 'gemini':
            return self._chat_gemini(messages, max_tokens)
        elif self.provider == 'openai':
            return self._chat_openai(messages, max_tokens)
        elif self.provider == 'local_llama':
            return self._chat_local_llama(messages, max_tokens)
        else:
            raise ValueError(f"Unknown provider: {self.provider}")

    def _chat_gemini(self, messages, max_tokens):
        # Gemini python lib uses a different history format
        # Convert standard messages to Gemini format
        # System prompt is usually set at model init or as first part
        
        history = []
        system_instruction = ""
        
        for msg in messages:
            if msg['role'] == 'system':
                system_instruction += msg['content'] + "\n"
            elif msg['role'] == 'user':
                history.append({'role': 'user', 'parts': [msg['content']]})
            elif msg['role'] == 'assistant':
                history.append({'role': 'model', 'parts': [msg['content']]})
        
        # Simple generation for now (stateless for the model object, but we pass history)
        # For 1.5 flash we can just generate content with the full context
        
        full_prompt = system_instruction + "\n\n"
        for h in history:
            role = "User" if h['role'] == 'user' else "Model"
            full_prompt += f"{role}: {h['parts'][0]}\n"
        full_prompt += "Model: "
        
        response = self.model.generate_content(full_prompt)
        return response.text

    def _chat_openai(self, messages, max_tokens):
        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=max_tokens
        )
        return response.choices[0].message.content

    def _chat_local_llama(self, messages, max_tokens):
        # Support for Ollama
        try:
            import requests
            ollama_base_url = current_app.config.get('OLLAMA_BASE_URL', 'http://host.docker.internal:11434')
            ollama_model = current_app.config.get('OLLAMA_MODEL', 'llama3')
            
            payload = {
                "model": ollama_model,
                "messages": messages,
                "stream": False
            }
            
            response = requests.post(f"{ollama_base_url}/api/chat", json=payload)
            response.raise_for_status()
            
            return response.json()['message']['content']
        except Exception as e:
            print(f"Error calling Ollama: {e}")
            return f"Error: Failed to connect to Ollama. {str(e)}"
