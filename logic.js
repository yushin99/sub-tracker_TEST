// 구독 데이터(subscription) 예시
//{
//  "id": "sub_1",
//  "name": "넷플릭스",
//  "amount": 13500,
//  "cycle": "monthly", //"monthly" 또는 "yearly"//  
//  "nextPaymentDate": "2024-06-15"
//  "category": "영상",
//  "paymentMethod": "신한카드"
//}


// 구독 1건의 결제 금액을 '한 달에 얼마를 쓰는가'로 바꿔 반환한다.
// 예를 들어 매월 13,500원이면 그대로 13,500원을 반환한다.
// 매년 120,000원이면 12개월로 나누어 월 10,000원으로 계산한다.
// 매년 금액을 나눈 결과가 소수이면 Math.round로 원 단위 반올림을 한다.
function getMonthlyAmount(subscription) {
    if (subscription.cycle === "monthly") {
        return subscription.amount;
    } else if (subscription.cycle === "yearly") {
        return Math.round(subscription.amount / 12);
    }
}


// 여러 구독을 받아 모든 구독의 월 환산 금액을 더한 총합을 반환한다.
// yearly 구독도 getMonthlyAmount를 거치므로 월간 구독과 같은 기준으로 합산된다.
function getTotalMonthlyAmount(subscriptions) {
    let total = 0;
    for (const subscription of subscriptions) {
        total += getMonthlyAmount(subscription);
    }
    return total;
}

// 전체 구독의 연간 예상 지출을 반환한다.
// 먼저 모든 구독을 월 기준으로 합산한 뒤, 12개월을 곱해 계산한다.
function getTotalYearlyAmount(subscriptions) {
    const totalMonthly = getTotalMonthlyAmount(subscriptions);
    return totalMonthly * 12;
}   

// 오늘부터 특정 결제일까지 며칠 남았는지 계산한다.
// today와 nextPaymentDate는 모두 "YYYY-MM-DD" 형식의 문자열이어야 한다.
// Date끼리의 차이를 밀리초로 구한 다음, 하루의 밀리초로 나누어 일수로 바꾼다.
// 오늘 결제면 0, 이미 지난 결제일이면 음수가 반환된다.
function getDaysUntilNextPayment(today, nextPaymentDate) {
    const todayDate = new Date(today);
    const paymentDate = new Date(nextPaymentDate);
    const timeDiff = paymentDate - todayDate;
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    return daysDiff;
}

// 결제일이 앞으로 days일 이내인 구독만 새 배열에 담아 반환한다.
// 이미 지난 결제일은 음수이므로 조건에서 자동으로 제외된다.
// 이 함수는 화면의 '이번 주 결제 예정' 숫자를 계산할 때 사용한다.
function getUpcomingPayments(subscriptions, today, days) {
    const upcoming = [];
    for (const subscription of subscriptions) {
        const daysUntilPayment = getDaysUntilNextPayment(today, subscription.nextPaymentDate);
        if (daysUntilPayment >= 0 && daysUntilPayment <= days) {
            upcoming.push(subscription);
        }
    }
    return upcoming;
}   

// 구독들을 카테고리별로 묶고, 각 카테고리의 월 환산 금액을 더한다.
// 반환 예시는 { "영상": 13500, "음악": 10900 } 형태이다.
// 같은 카테고리가 여러 번 나오면 기존 금액에 계속 더한다.
function getMonthlyAmountByCategory(subscriptions) {
    const categoryTotals = {};
    for (const subscription of subscriptions) {
        const monthlyAmount = getMonthlyAmount(subscription);
        if (categoryTotals[subscription.category]) {
            categoryTotals[subscription.category] += monthlyAmount;
        } else {
            categoryTotals[subscription.category] = monthlyAmount;
        }
    }   
    return categoryTotals;
}

// 결제 수단별로 구독을 묶고, 각 결제 수단의 월 환산 금액을 더한다.
// 반환 예시는 { "신한카드": 13500, "KB카드": 10900 } 형태이다.
// 현재 화면에서는 사용하지 않지만, 결제 수단별 통계를 만들 때 사용할 수 있다.
function getMonthlyAmountByPaymentMethod(subscriptions) {
    const paymentMethodTotals = {};
    for (const subscription of subscriptions) {
        const monthlyAmount = getMonthlyAmount(subscription);
        if (paymentMethodTotals[subscription.paymentMethod]) {
            paymentMethodTotals[subscription.paymentMethod] += monthlyAmount;
        } else {
            paymentMethodTotals[subscription.paymentMethod] = monthlyAmount;
        }
    }
    return paymentMethodTotals;
}

