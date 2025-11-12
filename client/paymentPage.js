const fmt = v => Number(v).toFixed(2);

        function updateTotals() {
            const products = Array.from(document.querySelectorAll('#chosen .course'));
            let items = products.length, sum = 0;
            products.forEach(p => {
                const price = parseFloat((p.dataset.price || 0).toString().replace(',','.')) || 0;
                sum += price;
            });
            document.getElementById('itemsCount').textContent = items;
            document.getElementById('total').textContent = fmt(sum) + ' ₪';
            document.getElementById('payAmount').textContent = fmt(sum) + ' ₪';
        }

        // Bonus: add to chosen
        document.getElementById('bonus').addEventListener('click', e => {
            if (e.target.classList.contains('add-btn')) {
                const product = e.target.closest('.course');
                if (!product) return;
                // move to chosen
                document.getElementById('chosen').appendChild(product);
                // change button into remove
                const btn = product.querySelector('.add-btn');
                if (btn) {
                    btn.className = 'remove-btn';
                    btn.textContent = 'הסר';
                    btn.title = 'הסר';
                }
                updateTotals();
            }
        });

        // Chosen: remove (delete from chosen)
        document.getElementById('chosen').addEventListener('click', e => {
            if (e.target.classList.contains('remove-btn')) {
                const product = e.target.closest('.course');
                if (product) {
                    product.remove();
                    // Move the course back to bonus
                    const bonusSection = document.getElementById('bonus');
                    bonusSection.appendChild(product);
                    const btn = product.querySelector('.remove-btn');
                    if (btn) {
                        btn.className = 'add-btn';
                        btn.textContent = 'הוסף';
                        btn.title = 'הוסף';
                    }
                }
                updateTotals();
            }
        });

        // Basic formatting helpers for card number and expiry
        document.getElementById('cardNumber').addEventListener('input', e => {
            let v = e.target.value.replace(/\D/g, '').slice(0,16);
            v = v.replace(/(.{4})/g, '$1 ').trim();
            e.target.value = v;
        });

        document.getElementById('exp').addEventListener('input', e => {
            let v = e.target.value.replace(/\D/g, '').slice(0,4);
            if (v.length > 2) v = v.slice(0,2) + '/' + v.slice(2);
            e.target.value = v;
        });

        // Submit handler (demo only - no real payment)
        document.getElementById('paymentForm').addEventListener('submit', function (ev) {
            ev.preventDefault();
            const btn = this.querySelector('.pay-btn');
            btn.disabled = true;
            btn.textContent = 'מעבד...';

            // Simple validation
            const name = document.getElementById('cardName').value.trim();
            const number = document.getElementById('cardNumber').value.replace(/\s/g,'');
            const exp = document.getElementById('exp').value;
            const cvc = document.getElementById('cvc').value.trim();

            if (!name || number.length < 13 || !/^\d{2}\/\d{2}$/.test(exp) || cvc.length < 3) {
                alert('אנא מלא/י נכון את פרטי התשלום.');
                btn.disabled = false;
                btn.textContent = 'שלם עכשיו';
                return;
            }

            setTimeout(() => {
                document.getElementById('notice').style.display = 'block';
                btn.textContent = 'הסתיימה';
                updateTotals();
            }, 900);
        });

        // Initialize totals
        updateTotals();