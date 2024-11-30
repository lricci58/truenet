import * as async from './modules/async.js';
import documentChecker from './modules/document-checker.js';
import * as loadingScreen from './modules/loading-screen.js';

document.addEventListener('DOMContentLoaded', function () {
	document.getElementById('web-title').innerHTML = 'Dashboard';

	// waits for document to load base promises
	documentChecker.isReady().then((loadedSuccessfully) => {
		if (!loadedSuccessfully) return;

		const fetchList = {}

		async.waitForAll(fetchList).then((result) => {
			quickUseFormSetup();
			loadingScreen.hide();
		});
	});
});

function quickUseFormSetup() {
	const formatNumber = (value) => {
		// removes any non-digit, non-dot and non-commas
		value = value.replace(/[^0-9.]/g, '');

		const parts = value.split('.');
		parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ','); // add commas for thousands
		return parts.join('.');
	}

	const transactionTypeSetup = (selected) => {
		const toInputGroup = document.querySelector('.child.arrived');
		const fromInputGroup = document.querySelector('.child.transfered');
		const creditInputGroup = document.querySelector('.child.credit');
		switch (selected) {
			case type['i']:
			case type['e']:
				toInputGroup.style.display = 'flex';
				fromInputGroup.style.display = '';
				creditInputGroup.style.display = '';
				break;
			case type['ba']: // Between Accounts
				toInputGroup.style.display = 'flex';
				fromInputGroup.style.display = 'flex';
				creditInputGroup.style.display = '';
				break;
			case type['c']: // Credit
				toInputGroup.style.display = '';
				fromInputGroup.style.display = '';
				creditInputGroup.style.display = 'flex';
				break;
			default:
				toInputGroup.style.display = '';
				fromInputGroup.style.display = '';
				creditInputGroup.style.display = '';
				break;
		}
	}

	const type = { 'i': 'Income', 'e': 'Expense', 'ba': 'Between Accounts', 'c': 'Credit' }

	// ONSUBMIT
	const form = document.querySelector('form.form-group');
	form.addEventListener('submit', function (e) {
		e.preventDefault();

		// transaction type
		const transactionType = form.querySelector('.dropdown-wrapper.type>.dropdown-trigger').textContent;

		// from
		const platformFrom = form.querySelector('.dropdown-wrapper.platform-from>.dropdown-trigger').textContent;
		const currencyFrom = form.querySelector('.dropdown-wrapper.currency>.dropdown-trigger').textContent;
		const amountFrom = document.getElementById('transaction-transfered-input').value;

		// to
		const platformTo = form.querySelector('.dropdown-wrapper.platform-to>.dropdown-trigger').textContent;
		const currencyTo = form.querySelector('.dropdown-wrapper.currency>.dropdown-trigger').textContent;
		const amountTo = document.getElementById('transaction-arrived-input').value;

		// concept
		const concept = document.getElementById('concept-input').value;

		// url is set based on the transaction type 
		const connUrl = transactionType == type['c'] ? '/php/insert/credit-expense.php' : '/php/insert/transfer.php';

		// complete form data
		const quiUseForm = new FormData();
		quiUseForm.append('platform-from', platformFrom);
		quiUseForm.append('currency-from', currencyFrom);
		quiUseForm.append('amount-from', amountFrom);

		quiUseForm.append('platform-to', platformTo);
		quiUseForm.append('currency-to', currencyTo);
		quiUseForm.append('amount-to', amountTo);

		// quiUseForm.append('credit-card', creditCard);
		// quiUseForm.append('credit-currency', creditCurreny);
		// quiUseForm.append('credit-installments', installments);
		// quiUseForm.append('credit-finance-time', financeTime);

		quiUseForm.append('concept', concept);

		async.get({
			url: connUrl,
			method: 'POST',
			data: quiUseForm
		});
	});

	// DROPDOWN CONTROLLER
	const dropdownWrapperList = form.querySelectorAll('.dropdown-wrapper');
	dropdownWrapperList.forEach(dropdownWrapper => {
		const dropdownTrigger = dropdownWrapper.querySelector('.dropdown-trigger');
		const dropdownButtonList = dropdownWrapper.querySelectorAll('.dropdown-button');
		dropdownButtonList.forEach(button => {
			button.addEventListener('mousedown', function () {
				if (button.classList.contains('selected')) return;

				const currentlySelected = dropdownWrapper.querySelector('.dropdown-button.selected');
				if (currentlySelected) currentlySelected.classList.remove('selected');

				button.classList.add('selected');
				const selectedString = button.textContent.trim();
				dropdownTrigger.textContent = selectedString;

				if (dropdownWrapper.classList.contains('type')) {
					transactionTypeSetup(selectedString);
				}
			})
		});
	});

	const quickUseInputList = form.querySelectorAll('.quick-use-input.value');
	quickUseInputList.forEach(quickUseInput => {
		quickUseInput.addEventListener('input', function (e) {
			let newValue = e.target.value;

			// save the cursor position before the change
			const cursorPos = e.target.selectionStart;

			newValue = newValue.replace(/[^0-9,.]/g, '').replace(/(\..*)\./g, '$1');

			const oldValue = e.target.value;
			newValue = formatNumber(newValue);
			e.target.value = newValue;

			// restore the cursor position after the change
			if (newValue.length > oldValue.length) {
				// if the length increased (which means a comma was added) adjust using the old value
				const diff = newValue.length - oldValue.length;
				e.target.selectionStart = cursorPos + diff;
				e.target.selectionEnd = e.target.selectionStart;
			} else {
				// if the length didn't increase, restore the cursor position normally
				const diff = newValue.length - e.target.value.length;
				e.target.selectionStart = cursorPos + diff;
				e.target.selectionEnd = e.target.selectionStart;
			}
		});

		quickUseInput.addEventListener('change', function (e) {
			let newValue = e.target.value;
			if (!newValue) return;
			newValue = newValue.replace(/,/g, '');
			if (!newValue.includes('.')) {
				newValue += '.00';
			} else {
				let [integerPart, decimalPart] = newValue.split('.');
				decimalPart = decimalPart.padEnd(2, '0'); // Ensure 2 decimal places
				newValue = `${integerPart}.${decimalPart}`;
			}
			newValue = formatNumber(newValue);
			e.target.value = newValue;
		});
	});
}