type Props = {
  // Proprietà per gestire stati o errori futuri
  error?: string;
}

export default function SellProductModal({ error }: Props) {
  return (
    <div id="modal-sell" class="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 transition-opacity animate-fade-in">
      <div 
        class="bg-white w-full max-w-xl rounded-2xl shadow-xl border border-gray-100 flex flex-col max-h-[90vh] overflow-hidden"
        onclick="event.stopPropagation()"
      >
        {/* Header della Modale */}
        <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 class="text-xl font-bold text-gray-900">Vendi un Prodotto</h2>
          <button 
            type="button"
            onclick="document.getElementById('modal-sell').remove()"
            class="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* FORM FONDAMENTALE CON ENCODING MULTIPART PER I FILE */}
        <form 
          hx-post="/sell-product" 
          hx-encoding="multipart/form-data" 
          hx-target="#modal" 
          hx-swap="innerHTML"
          class="flex-1 overflow-y-auto p-6 space-y-4"
        >
          {error && (
            <div class="p-3 bg-red-50 border border-red-100 text-red-600 text-sm font-medium rounded-xl">
              {error}
            </div>
          )}

          {/* Nome Prodotto */}
          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold text-gray-700" for="productName">Nome Prodotto</label>
            <input 
              type="text" 
              id="productName" 
              name="productName" 
              required 
              placeholder="es. iPhone 15 Pro Max"
              class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white"
            />
          </div>

          {/* Prezzo e Stock */}
          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-1">
              <label class="text-sm font-semibold text-gray-700" for="price">Prezzo ($)</label>
              <input 
                type="number" 
                id="price" 
                name="price" 
                step="0.01" 
                min="0.01" 
                required 
                placeholder="0.00"
                class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white"
              />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm font-semibold text-gray-700" for="stock">Quantità Stock</label>
              <input 
                type="number" 
                id="stock" 
                name="stock" 
                min="1" 
                required 
                placeholder="1"
                class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white"
              />
            </div>
          </div>

          {/* Categoria */}
          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold text-gray-700" for="category">Categoria</label>
            <select 
              id="category" 
              name="category" 
              required
              class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white"
            >
              <option value="" disabled selected>Seleziona una categoria</option>
              <option value="Toy">Toy</option>
              <option value="Tech">Tech</option>
              <option value="Auto">Auto</option>
              
            </select>
          </div>

          {/* Descrizione */}
          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold text-gray-700" for="description">Descrizione</label>
            <textarea 
              id="description" 
              name="description" 
              rows="3"
              placeholder="Descrivi brevemente le caratteristiche del prodotto..."
              class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white resize-none"
            ></textarea>
          </div>

          {/* Sezione Caricamento Immagini */}
          <div class="space-y-3 pt-2">
            <label class="block text-sm font-semibold text-gray-700 mb-1" for="images">
              Immagini Prodotto (Seleziona una o più)
            </label>
            
            <input 
              type="file" 
              id="images" 
              name="images" 
              accept="image/*" 
              multiple 
              onchange="handleProductPreviews(this)"
              class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
            />

            {/* Contenitore dinamico per l'anteprima e la scelta della copertina */}
            <div class="space-y-2 mt-3 hidden" id="cover-selection-wrapper">
              <p class="text-xs font-medium text-gray-500">Seleziona l'immagine che preferisci come copertina principale:</p>
              <div id="image-previews" class="grid grid-cols-3 gap-3"></div>
            </div>
          </div>

          {/* Pulsanti di Azione in fondo al Form */}
          <div class="pt-4 border-t border-gray-100 flex justify-end gap-3 bg-white sticky bottom-0">
            <button 
              type="button" 
              onclick="document.getElementById('modal-sell').remove()"
              class="px-5 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-xl text-sm hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Annulla
            </button>
            <button 
              type="submit" 
              class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold rounded-xl text-sm shadow-sm transition-colors cursor-pointer"
            >
              Pubblica Prodotto
            </button>
          </div>
        </form>
      </div>

      {/* Script Vanilla isolato per le anteprime dinamiche */}
      <script type="text/javascript">
        {`
          window.handleProductPreviews = function(input) {
            const wrapper = document.getElementById('cover-selection-wrapper');
            const container = document.getElementById('image-previews');
            
            container.innerHTML = '';
            if (!input.files || !input.files.length) {
              wrapper.classList.add('hidden');
              return;
            }
            
            wrapper.classList.remove('hidden');

            Array.from(input.files).forEach((file, idx) => {
              const reader = new FileReader();
              reader.onload = function(e) {
                const card = document.createElement('div');
                card.className = 'relative border-3 rounded-xl overflow-hidden aspect-square bg-gray-50 flex flex-col justify-end p-2 cursor-pointer transition-all shadow-xs transform active:scale-95';
                
                if (idx === 0) {
                  card.classList.add('border-indigo-600', 'ring-2', 'ring-indigo-100');
                } else {
                  card.classList.add('border-transparent');
                }
                
                const img = document.createElement('img');
                img.src = e.target.result;
                img.className = 'absolute inset-0 w-full h-full object-cover z-0 pointer-events-none';
                card.appendChild(img);
                
                const overlay = document.createElement('div');
                overlay.className = 'absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent z-10 pointer-events-none';
                card.appendChild(overlay);
                
                const label = document.createElement('label');
                label.className = 'relative z-20 bg-white/95 px-2 py-1 rounded-md text-[10px] font-bold text-gray-700 flex items-center gap-1.5 cursor-pointer shadow-xs mx-auto';
                
                const radio = document.createElement('input');
                radio.type = 'radio';
                radio.name = 'coverIndex';
                radio.value = idx;
                radio.checked = (idx === 0);
                radio.className = 'text-indigo-600 focus:ring-indigo-500 w-3 h-3 cursor-pointer';
                
                radio.onchange = function() {
                  container.querySelectorAll('.border-indigo-600').forEach(el => {
                    el.classList.remove('border-indigo-600', 'ring-2', 'ring-indigo-100');
                    el.classList.add('border-transparent');
                  });
                  card.classList.remove('border-transparent');
                  card.classList.add('border-indigo-600', 'ring-2', 'ring-indigo-100');
                };
                
                label.appendChild(radio);
                label.appendChild(document.createTextNode('Copertina'));
                card.appendChild(label);
                
                card.onclick = function(evt) {
                  if (evt.target !== radio) {
                    radio.checked = true;
                    radio.onchange();
                  }
                };
                
                container.appendChild(card);
              };
              reader.readAsDataURL(file);
            });
          }
        `}
      </script>
    </div>
  )
}