type Props = {
  error?: string;
}

export default function SellProductModal({ error }: Props) {
  return (
    <div id="modal-sell" class="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 transition-opacity animate-fade-in">
      <style>{`
        .loading-spinner { display: none; }
        .htmx-request .loading-spinner { display: inline; }
        .htmx-request .default-text { display: none; }
      `}</style>
      <div 
        class="bg-white w-full max-w-xl rounded-2xl shadow-xl border border-gray-100 flex flex-col max-h-[90vh] overflow-hidden"
        onclick="event.stopPropagation()"
      >
        <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
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

        <form 
          hx-post="/sell-product" 
          hx-encoding="multipart/form-data" 
          hx-target="#modal" 
          hx-swap="innerHTML"
          onsubmit="if(document.querySelectorAll('.preview-card').length === 0) { alert('Carica almeno un\'immagine del prodotto!'); return false; }"
          class="flex-1 flex flex-col overflow-hidden"
        >
          
          <div class="flex-1 overflow-y-auto p-6 space-y-4">
            {error && (
              <div class="p-3 bg-red-50 border border-red-100 text-red-600 text-sm font-medium rounded-xl">
                {error}
              </div>
            )}

            <div class="flex flex-col gap-1">
              <label class="text-sm font-semibold text-gray-700" for="productName">Nome Prodotto</label>
              <input 
                type="text" 
                id="productName" 
                name="productName" 
                required 
                maxlength="80"
                pattern=".*\S.*"
                title="Il nome del prodotto non può essere vuoto o composto da soli spasi"
                placeholder="es. iPhone 15 Pro Max"
                class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="flex flex-col gap-1">
                <label class="text-sm font-semibold text-gray-700" for="price">Prezzo (€)</label>
                <input 
                  type="number" 
                  id="price" 
                  name="price" 
                  step="0.01" 
                  min="0.01" 
                  max="999999.99"
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
                  max="99999"
                  required 
                  placeholder="1"
                  class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white"
                />
              </div>
            </div>

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

            <div class="flex flex-col gap-1">
              <div class="flex justify-between items-center mb-0.5">
                <label class="text-sm font-semibold text-gray-700" for="description">Descrizione</label>
                <button 
                  type="button"
                  hx-post="/magic-description"
                  hx-include="closest form"
                  hx-encoding="multipart/form-data"
                  hx-target="#description"
                  hx-swap="outerHTML"
                  class="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span class="default-text">✨ Scrittura Magica</span>
                  <span class="loading-spinner animate-pulse">🪄 Generando...</span>
                </button>
              </div>
              <textarea 
                id="description" 
                name="description" 
                rows="3"
                maxlength="1000"
                placeholder="Descrivi brevemente le caratteristiche del prodotto (max 1000 caratteri)..."
                class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white resize-none"
              ></textarea>
            </div>

            <div class="space-y-3 pt-2">
              <label class="block text-sm font-semibold text-gray-700 mb-1">
                Immagini Prodotto
              </label>
              
              <div id="cover-selection-wrapper" class="space-y-2">
                <p class="text-xs font-medium text-gray-500">Aggiungi i file uno alla volta. Clicca sulla card per decidere la copertina principale:</p>
                
                <div class="grid grid-cols-3 gap-3">
                  <div id="image-previews" class="contents"></div>
                  
                  <button 
                    type="button"
                    onclick="triggerImageUpload()"
                    class="border-2 border-dashed border-gray-300 hover:border-indigo-500 rounded-xl aspect-square flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:text-indigo-600 transition-colors bg-gray-50/50 cursor-pointer group"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5 group-hover:scale-110 transition-transform">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    <span class="text-[11px] font-bold">Aggiungi</span>
                  </button>
                </div>
              </div>
              
              <div id="hidden-inputs-container" class="hidden"></div>
            </div>
          </div>

          <div class="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-white shrink-0">
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


      <script type="text/javascript">
        {`
          window.imgIdCounter = window.imgIdCounter || 0;

          window.triggerImageUpload = function() {
            const hiddenContainer = document.getElementById('hidden-inputs-container');
            const previewsContainer = document.getElementById('image-previews');
            
            const input = document.createElement('input');
            input.type = 'file';
            input.name = 'images';
            input.accept = 'image/*';
            input.className = 'hidden';
            
            window.imgIdCounter++;
            const currentId = window.imgIdCounter;
            input.id = 'img-input-' + currentId;
            
            input.onchange = function() {
              if (!input.files || !input.files.length) {
                input.remove();
                return;
              }
              
              hiddenContainer.appendChild(input);
              
              const file = input.files[0];
              const reader = new FileReader();
              reader.onload = function(e) {
                const card = document.createElement('div');
                card.id = 'preview-card-' + currentId;
                card.className = 'preview-card relative border-3 rounded-xl overflow-hidden aspect-square bg-gray-50 flex flex-col justify-end p-2 cursor-pointer transition-all shadow-xs transform active:scale-95 group border-transparent';
                
                const img = document.createElement('img');
                img.src = e.target.result;
                img.className = 'absolute inset-0 w-full h-full object-cover z-0 pointer-events-none';
                card.appendChild(img);
                
                const overlay = document.createElement('div');
                overlay.className = 'absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent z-10 pointer-events-none';
                card.appendChild(overlay);
                
                const delBtn = document.createElement('button');
                delBtn.type = 'button';
                delBtn.className = 'absolute top-1.5 right-1.5 z-30 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer';
                delBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>';
                delBtn.onclick = function(evt) {
                  evt.stopPropagation();
                  card.remove();
                  input.remove();
                  updateCoverIndices();
                };
                card.appendChild(delBtn);
                
                const label = document.createElement('label');
                label.className = 'relative z-20 bg-white/95 px-2 py-1 rounded-md text-[10px] font-bold text-gray-700 flex items-center gap-1.5 cursor-pointer shadow-xs mx-auto';
                
                const radio = document.createElement('input');
                radio.type = 'radio';
                radio.name = 'coverIndex';
                radio.className = 'text-indigo-600 focus:ring-indigo-500 w-3 h-3 cursor-pointer';
                
                radio.onchange = function() {
                  previewsContainer.querySelectorAll('.preview-card').forEach(el => {
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
                  if (evt.target !== radio && evt.target !== delBtn && !delBtn.contains(evt.target)) {
                    radio.checked = true;
                    radio.onchange();
                  }
                };
                
                previewsContainer.appendChild(card);
                updateCoverIndices();
              };
              reader.readAsDataURL(file);
            };
            
            input.click();
          };

          window.updateCoverIndices = function() {
            const container = document.getElementById('image-previews');
            const cards = container.querySelectorAll('.preview-card');
            
            if (cards.length === 0) return;
            
            let hasChecked = false;
            cards.forEach((card, idx) => {
              const radio = card.querySelector('input[type="radio"]');
              radio.value = idx;
              if (radio.checked) {
                hasChecked = true;
                card.classList.remove('border-transparent');
                card.classList.add('border-indigo-600', 'ring-2', 'ring-indigo-100');
              }
            });
            
            if (!hasChecked && cards.length > 0) {
              const firstRadio = cards[0].querySelector('input[type="radio"]');
              firstRadio.checked = true;
              firstRadio.onchange();
            }
          };
        `}
      </script>
    
        </div>
    </div>
  )
}
