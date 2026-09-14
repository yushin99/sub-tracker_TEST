import { renderCategories, renderSubscriptions, renderSummary } from './ui.js';

const STORAGE_KEY = 'sub-tracker-subscriptions';
let subscriptions = loadSubscriptions();

const form = document.querySelector('#subscription-form');
const toast = document.querySelector('#toast');

// 폼이 제출될 때 실행된다.
// FormData로 입력값을 읽어 구독 객체를 만들고, 수정 중이면 기존 항목을 교체한다.
// 새 항목이면 배열 뒤에 추가한 뒤 localStorage와 화면을 함께 갱신한다.
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const editingId = data.get('editing-id');
  const subscription = {
    id: editingId || `sub_${Date.now()}`,
    name: data.get('name').trim(),
    amount: Number(data.get('amount')),
    cycle: data.get('cycle'),
    nextPaymentDate: data.get('nextPaymentDate'),
    category: data.get('category').trim(),
    paymentMethod: data.get('paymentMethod').trim()
  };
  subscriptions = editingId
    ? subscriptions.map((item) => item.id === editingId ? subscription : item)
    : [...subscriptions, subscription];
  saveAndRender();
  resetForm();
  showToast(editingId ? '구독 정보가 수정되었습니다.' : '새 구독이 추가되었습니다.');
});

// 목록 전체에 클릭 이벤트를 하나만 연결하는 이벤트 위임 방식이다.
// 목록을 다시 그려도 부모 요소의 이벤트는 유지되므로 수정/삭제 버튼이 계속 작동한다.
document.querySelector('#subscription-list').addEventListener('click', (event) => {
  const editButton = event.target.closest('[data-edit-id]');
  const deleteButton = event.target.closest('[data-delete-id]');
  if (editButton) startEditing(editButton.dataset.editId);
  if (deleteButton) removeSubscription(deleteButton.dataset.deleteId);
});

// 취소 버튼을 누르면 수정 모드를 끝내고 입력 폼을 새 구독 상태로 되돌린다.
document.querySelector('#cancel-button').addEventListener('click', resetForm);

// 상단의 '+ 구독 추가' 버튼을 누르면 폼 위치로 부드럽게 이동하고 이름 입력란에 포커스를 준다.
document.querySelector('[data-scroll-to-form]').addEventListener('click', () => {
  document.querySelector('#form-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  document.querySelector('#name').focus();
});

// localStorage에 저장된 구독 목록을 읽는다.
// 저장 데이터가 없거나 JSON 형식이 깨졌거나 배열이 아니면 빈 배열을 반환한다.
function loadSubscriptions() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    return [];
  }
}

// 현재 구독 배열을 localStorage에 저장하고 화면의 모든 영역을 다시 그린다.
// 추가, 수정, 삭제 후 이 함수 하나를 호출하면 목록과 요약이 함께 최신 상태가 된다.
function saveAndRender() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions));
  const today = getToday();
  renderSummary(subscriptions, today);
  renderSubscriptions(subscriptions, today);
  renderCategories(subscriptions);
}

// 선택한 구독의 값을 폼에 채우고 수정 모드로 전환한다.
// 수정할 항목의 id를 hidden input에 보관해 제출 시 기존 항목을 찾을 수 있게 한다.
function startEditing(id) {
  const subscription = subscriptions.find((item) => item.id === id);
  if (!subscription) return;
  document.querySelector('#editing-id').value = subscription.id;
  document.querySelector('#name').value = subscription.name;
  document.querySelector('#amount').value = subscription.amount;
  document.querySelector('#cycle').value = subscription.cycle;
  document.querySelector('#next-payment-date').value = subscription.nextPaymentDate;
  document.querySelector('#category').value = subscription.category;
  document.querySelector('#payment-method').value = subscription.paymentMethod || '';
  document.querySelector('#form-title').textContent = '구독 수정';
  document.querySelector('#save-button').textContent = '수정 저장';
  document.querySelector('#cancel-button').classList.remove('hidden');
  document.querySelector('#form-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// 삭제할 구독을 찾은 뒤 사용자에게 한 번 더 확인을 받는다.
// 확인했을 때만 배열에서 해당 id를 제거하고 저장 및 화면 갱신을 실행한다.
function removeSubscription(id) {
  const subscription = subscriptions.find((item) => item.id === id);
  if (!subscription || !window.confirm(`'${subscription.name}' 구독을 삭제할까요?`)) return;
  subscriptions = subscriptions.filter((item) => item.id !== id);
  saveAndRender();
  showToast('구독이 삭제되었습니다.');
}

// 폼 입력값과 수정 상태를 초기화한다.
// 저장 완료 후에는 새 구독 입력 상태로, 수정 취소 후에도 같은 상태로 사용된다.
function resetForm() {
  form.reset();
  document.querySelector('#editing-id').value = '';
  document.querySelector('#form-title').textContent = '새 구독 추가';
  document.querySelector('#save-button').textContent = '구독 저장';
  document.querySelector('#cancel-button').classList.add('hidden');
}

// 현재 컴퓨터의 날짜를 logic.js가 사용하는 "YYYY-MM-DD" 문자열로 만든다.
// 월과 일이 한 자리일 때 앞에 0을 붙여 날짜 비교가 정확하게 되도록 한다.
function getToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// 저장, 수정, 삭제 결과를 잠깐 보여주는 알림 메시지를 화면에 표시한다.
// 2.2초 뒤 show 클래스를 제거해 자연스럽게 사라지게 한다.
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 2200);
}

saveAndRender();