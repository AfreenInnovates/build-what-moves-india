import fs from 'node:fs';

const rupees = (r) => r * 100;

// Each persona is a distinct real failure mode, not a cosmetic variation.
const people = {
  lakshmi: {
    member: {
      uan: '100200300402',
      demo_password: 'demo1234',
      display_name: 'Lakshmi Narayanan',
      scenario: 'rejected',
      headline: 'Married name never updated, and the employer has shut down',
      epfo_name: 'LAKSHMI SUBRAMANIAN',
      epfo_dob: '1992-02-19',
      epfo_father_name: 'R SUBRAMANIAN',
      date_of_joining: '2019-01-07',
      date_of_exit: '2025-11-28',
      employer_name: 'Coastal Apparels Pvt Ltd (closed)',
      employer_responsive: false,
      eps_service_months: 82,
      balance_paise: rupees(645200),
      uan_active: true,
      e_nomination_filed: true,
      aadhaar_linked: true,
    },
    intake: { errorFromClosedEmployer: true, formSelected: false },
    documents: {
      aadhaar: { script: 'latin', name: 'LAKSHMI NARAYANAN', dob: '1992-02-19', father_name: 'R SUBRAMANIAN', id_number: '0771 3390 5528', gender: 'FEMALE', address: '22/4 Beach Road, Mangaluru 575001' },
      pan: { script: 'latin', name: 'LAKSHMI SUBRAMANIAN', dob: '1992-02-19', father_name: 'R SUBRAMANIAN', id_number: 'ZZZZZ2222Z' },
      bank: { script: 'kannada', name: 'L NARAYANAN', name_native: 'ಎಲ್ ನಾರಾಯಣನ್', bank_name: 'Demo Bank of India', bank_name_native: 'ಡೆಮೊ ಬ್ಯಾಂಕ್ ಆಫ್ ಇಂಡಿಯಾ', branch_native: 'ಮಂಗಳೂರು ಶಾಖೆ', account_number: '0000 4455 6677', ifsc: 'DEMO0000003' },
      epfo: { script: 'latin', name: 'LAKSHMI SUBRAMANIAN', dob: '1992-02-19', father_name: 'R SUBRAMANIAN', id_number: '100200300402' },
    },
    service_history: [
      { uan: '100200300402', employer_name: 'Coastal Apparels Pvt Ltd', from_date: '2019-01-07', to_date: '2025-11-28', eps_months: 82 },
    ],
  },

  arjun: {
    member: {
      uan: '100200300403',
      demo_password: 'demo1234',
      display_name: 'Arjun Mehta',
      scenario: 'advance',
      headline: 'Still employed, needs a medical advance rather than a withdrawal',
      epfo_name: 'ARJUN MEHTA',
      epfo_dob: '1996-08-30',
      epfo_father_name: 'VIKRAM MEHTA',
      date_of_joining: '2023-03-13',
      date_of_exit: null,
      employer_name: 'Northstar Systems Pvt Ltd',
      employer_responsive: true,
      eps_service_months: 34,
      balance_paise: rupees(185000),
      uan_active: true,
      e_nomination_filed: false,
      aadhaar_linked: true,
    },
    intake: { stillEmployed: true, formSelected: false },
    documents: {
      aadhaar: { script: 'latin', name: 'ARJUN MEHTA', dob: '1996-08-30', father_name: 'VIKRAM MEHTA', id_number: '0559 8812 4471', gender: 'MALE', address: 'B-104, Green Meadows, Pune 411045' },
      pan: { script: 'latin', name: 'ARJUN MEHTA', dob: '1996-08-30', father_name: 'VIKRAM MEHTA', id_number: 'ZZZZZ3333Z' },
      bank: { script: 'devanagari', name: 'ARJUN MEHTA', name_native: 'अर्जुन मेहता', bank_name: 'Demo Bank of India', bank_name_native: 'डेमो बैंक ऑफ इंडिया', branch_native: 'पुणे शाखा', account_number: '0000 9911 2233', ifsc: 'DEMO0000004' },
      epfo: { script: 'latin', name: 'ARJUN MEHTA', dob: '1996-08-30', father_name: 'VIKRAM MEHTA', id_number: '100200300403' },
    },
    service_history: [
      { uan: '100200300403', employer_name: 'Northstar Systems Pvt Ltd', from_date: '2023-03-13', to_date: null, eps_months: 34 },
    ],
  },

  farhan: {
    member: {
      uan: '100200300404',
      demo_password: 'demo1234',
      display_name: 'Farhan Qureshi',
      scenario: 'rejected',
      headline: 'UAN never activated, and a date of birth that is one month out',
      epfo_name: 'FARHAN QURESHI',
      epfo_dob: '1979-02-22',
      epfo_father_name: 'IQBAL QURESHI',
      date_of_joining: '2013-06-01',
      date_of_exit: '2026-01-31',
      employer_name: 'Deccan Engineering Works',
      employer_responsive: true,
      eps_service_months: 152,
      balance_paise: rupees(1240000),
      uan_active: false,
      e_nomination_filed: false,
      aadhaar_linked: false,
    },
    intake: { formSelected: false },
    documents: {
      aadhaar: { script: 'latin', name: 'FARHAN QURESHI', dob: '1979-03-22', father_name: 'IQBAL QURESHI', id_number: '0334 7761 9082', gender: 'MALE', address: '17 Nizam Colony, Hyderabad 500028' },
      pan: { script: 'latin', name: 'FARHAN QURESHI', dob: '1979-03-22', father_name: 'IQBAL QURESHI', id_number: 'ZZZZZ4444Z' },
      bank: { script: 'latin', name: 'FARHAN QURESHI', name_native: 'FARHAN QURESHI', bank_name: 'Demo Bank of India', bank_name_native: 'Demo Bank of India', branch_native: 'Hyderabad Branch', account_number: '0000 2244 6688', ifsc: 'DEMO0000005' },
      epfo: { script: 'latin', name: 'FARHAN QURESHI', dob: '1979-02-22', father_name: 'IQBAL QURESHI', id_number: '100200300404' },
    },
    service_history: [
      { uan: '100200300404', employer_name: 'Deccan Engineering Works', from_date: '2013-06-01', to_date: '2026-01-31', eps_months: 152 },
    ],
  },

  sunita: {
    member: {
      uan: '100200300405',
      demo_password: 'demo1234',
      display_name: 'Sunita Devi',
      scenario: 'rejected',
      headline: 'Records are clean, but nobody marked the exit and there is a real gap',
      epfo_name: 'SUNITA DEVI',
      epfo_dob: '1994-12-05',
      epfo_father_name: 'RAM PRASAD',
      date_of_joining: '2022-04-04',
      date_of_exit: null,
      employer_name: 'Ganga Foods Pvt Ltd',
      employer_responsive: true,
      eps_service_months: 52,
      balance_paise: rupees(78000),
      uan_active: true,
      e_nomination_filed: true,
      aadhaar_linked: true,
    },
    intake: { formSelected: false },
    documents: {
      aadhaar: { script: 'latin', name: 'SUNITA DEVI', dob: '1994-12-05', father_name: 'RAM PRASAD', id_number: '0668 1123 7745', gender: 'FEMALE', address: '9 Nehru Nagar, Patna 800013' },
      pan: { script: 'latin', name: 'SUNITA DEVI', dob: '1994-12-05', father_name: 'RAM PRASAD', id_number: 'ZZZZZ5555Z' },
      bank: { script: 'devanagari', name: 'SUNITA DEVI', name_native: 'सुनीता देवी', bank_name: 'Demo Bank of India', bank_name_native: 'डेमो बैंक ऑफ इंडिया', branch_native: 'पटना शाखा', account_number: '0000 3355 7799', ifsc: 'DEMO0000006' },
      epfo: { script: 'latin', name: 'SUNITA DEVI', dob: '1994-12-05', father_name: 'RAM PRASAD', id_number: '100200300405' },
    },
    service_history: [
      { uan: '100200300405', employer_name: 'Ganga Foods Pvt Ltd', from_date: '2022-04-04', to_date: null, eps_months: 28 },
      { uan: '100200300405', employer_name: 'Bihar Grain Traders', from_date: '2019-05-02', to_date: '2021-08-14', eps_months: 24 },
    ],
  },
};

for (const [slug, data] of Object.entries(people)) {
  fs.writeFileSync(`fixtures/data/${slug}.json`, JSON.stringify(data, null, 2) + '\n');
  console.log('wrote', slug);
}
