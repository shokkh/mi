const localKeys = {
    profile: 'ielts-master-profile',
    progress: 'ielts-master-mock-progress',
    activity: 'ielts-master-mock-active-days'
};
const accountForm = document.getElementById('accountSignInForm');
const accountSummary = document.getElementById('accountSummary');
const accountStatus = document.getElementById('accountStatus');
const accountSignOut = document.getElementById('accountSignOut');
let auth;
let database;
let firebaseSdk;
let currentUser = null;
let syncQueue = Promise.resolve();

function setAccountStatus(message, isError) {
    accountStatus.textContent = message;
    accountStatus.classList.toggle('error', isError);
    accountStatus.hidden = !message;
}

function friendlyAuthError(error) {
    const messages = {
        'auth/email-already-in-use': 'An account already uses this email. Sign in instead.',
        'auth/invalid-credential': 'Email or password is incorrect.',
        'auth/invalid-email': 'Enter a valid email address.',
        'auth/popup-closed-by-user': 'Google sign-in was closed before completion.',
        'auth/weak-password': 'Choose a password with at least 8 characters.',
        'auth/unauthorized-domain': 'This site domain is not enabled for Firebase Authentication.',
        'auth/network-request-failed': 'Network error. Check your connection and try again.'
    };
    return messages[error.code] || 'Account request failed. Check your details and try again.';
}

function setAuthControlsDisabled(disabled) {
    accountForm.querySelectorAll('input, button').forEach(element => {
        element.disabled = disabled;
    });
}

function readLocal(key, fallback) {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
}

function writeLocal(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function validProfile(value) {
    return value &&
        typeof value.name === 'string' &&
        value.name.trim().length > 0 &&
        value.name.trim().length <= 40 &&
        typeof value.targetBand === 'number' &&
        Number.isFinite(value.targetBand) &&
        value.targetBand >= 1 &&
        value.targetBand <= 9 &&
        Number.isInteger(value.targetBand * 2);
}

function mergeProgress(localRecords, cloudRecords) {
    const merged = new Map();
    for (const record of [...cloudRecords, ...localRecords]) {
        if (!record || typeof record.skill !== 'string' || typeof record.paperId !== 'string') continue;
        merged.set(`${record.skill}:${record.paperId}`, { skill: record.skill, paperId: record.paperId });
    }
    return [...merged.values()];
}

function mergeDays(localDays, cloudDays) {
    return [...new Set([...cloudDays, ...localDays].filter(day =>
        typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day)
    ))].sort();
}

function updateAccountUI(user) {
    currentUser = user;
    accountForm.hidden = Boolean(user);
    accountSignOut.hidden = !user;
    accountSummary.textContent = user
        ? `Signed in as ${user.email || user.displayName || 'Google user'}. Profile and mock progress sync to your account.`
        : 'Sign in to sync your profile and mock progress across devices.';
    setAuthControlsDisabled(false);
    if (!user) setAccountStatus('', false);
}

async function syncAccountData(user) {
    const profileRef = firebaseSdk.doc(database, 'users', user.uid, 'data', 'profile');
    const progressRef = firebaseSdk.doc(database, 'users', user.uid, 'data', 'mockProgress');
    const activityRef = firebaseSdk.doc(database, 'users', user.uid, 'data', 'activity');
    const [profileSnapshot, progressSnapshot, activitySnapshot] = await Promise.all([
        firebaseSdk.getDoc(profileRef),
        firebaseSdk.getDoc(progressRef),
        firebaseSdk.getDoc(activityRef)
    ]);

    const localProfile = readLocal(localKeys.profile, null);
    let profileForUI = validProfile(localProfile) ? localProfile : null;
    if (profileSnapshot.exists()) {
        const cloudProfile = profileSnapshot.data();
        if (validProfile(cloudProfile)) {
            profileForUI = {
                name: cloudProfile.name.trim(),
                targetBand: cloudProfile.targetBand,
                onboardingComplete: cloudProfile.onboardingComplete === true
            };
            writeLocal(localKeys.profile, profileForUI);
        } else {
            throw new Error('The saved cloud profile has an unexpected format.');
        }
    } else if (validProfile(localProfile)) {
        await firebaseSdk.setDoc(profileRef, {
            name: localProfile.name.trim(),
            targetBand: localProfile.targetBand,
            onboardingComplete: localProfile.onboardingComplete === true,
            updatedAt: firebaseSdk.serverTimestamp()
        });
    }

    const localProgress = readLocal(localKeys.progress, []);
    const cloudProgress = progressSnapshot.exists() && Array.isArray(progressSnapshot.data().records)
        ? progressSnapshot.data().records
        : [];
    const records = mergeProgress(localProgress, cloudProgress);
    writeLocal(localKeys.progress, records);
    await firebaseSdk.setDoc(progressRef, { records, updatedAt: firebaseSdk.serverTimestamp() });

    const localDays = readLocal(localKeys.activity, []);
    const cloudDays = activitySnapshot.exists() && Array.isArray(activitySnapshot.data().days)
        ? activitySnapshot.data().days
        : [];
    const days = mergeDays(localDays, cloudDays);
    writeLocal(localKeys.activity, days);
    await firebaseSdk.setDoc(activityRef, { days, updatedAt: firebaseSdk.serverTimestamp() });
    window.dispatchEvent(new CustomEvent('ielts:cloud-data-updated', {
        detail: { profile: profileForUI }
    }));
}

function queueSync() {
    if (!currentUser) return;
    const user = currentUser;
    syncQueue = syncQueue
        .then(() => syncAccountData(user))
        .catch(error => {
            console.error('Cloud study data could not be synced.', error);
            setAccountStatus('Cloud sync failed. Your local practice is still available; check your connection and Firebase setup.', true);
        });
}

async function initializeAccount() {
    try {
        const [appSdk, authSdk, firestoreSdk] = await Promise.all([
            import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js'),
            import('https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js'),
            import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js')
        ]);
        firebaseSdk = {
            initializeApp: appSdk.initializeApp,
            createUserWithEmailAndPassword: authSdk.createUserWithEmailAndPassword,
            GoogleAuthProvider: authSdk.GoogleAuthProvider,
            onAuthStateChanged: authSdk.onAuthStateChanged,
            signInWithEmailAndPassword: authSdk.signInWithEmailAndPassword,
            signInWithPopup: authSdk.signInWithPopup,
            signOut: authSdk.signOut,
            getAuth: authSdk.getAuth,
            doc: firestoreSdk.doc,
            getDoc: firestoreSdk.getDoc,
            getFirestore: firestoreSdk.getFirestore,
            serverTimestamp: firestoreSdk.serverTimestamp,
            setDoc: firestoreSdk.setDoc
        };
        const configResponse = await fetch('/api/firebase-config', { cache: 'no-store' });
        const config = await configResponse.json().catch(() => ({}));
        if (!configResponse.ok) {
            throw new Error(config.error || 'Cloud sign-in is not configured on this host.');
        }

        const app = firebaseSdk.initializeApp(config);
        auth = firebaseSdk.getAuth(app);
        database = firebaseSdk.getFirestore(app);
        window.ieltsAccount = {
            getIdToken: async () => {
                if (!currentUser) throw new Error('Sign in before requesting AI feedback.');
                return currentUser.getIdToken();
            }
        };
        accountForm.addEventListener('submit', async event => {
            event.preventDefault();
            const form = event.currentTarget;
            const email = form.elements.email.value.trim();
            const password = form.elements.password.value;
            setAccountStatus('Signing in…', false);
            try {
                await firebaseSdk.signInWithEmailAndPassword(auth, email, password);
                form.elements.password.value = '';
                setAccountStatus('', false);
            } catch (error) {
                console.error('Email sign-in failed.', error);
                setAccountStatus(friendlyAuthError(error), true);
            }
        });
        accountForm.addEventListener('click', async event => {
            const button = event.target.closest('[data-account-action]');
            if (!button) return;
            const action = button.dataset.accountAction;
            const email = accountForm.elements.email.value.trim();
            const password = accountForm.elements.password.value;
            if (action === 'signup') {
                if (!accountForm.reportValidity()) return;
                setAccountStatus('Creating your account…', false);
                try {
                    await firebaseSdk.createUserWithEmailAndPassword(auth, email, password);
                    accountForm.elements.password.value = '';
                    setAccountStatus('', false);
                } catch (error) {
                    console.error('Account creation failed.', error);
                    setAccountStatus(friendlyAuthError(error), true);
                }
            } else if (action === 'google') {
                setAccountStatus('Opening Google sign-in…', false);
                try {
                    await firebaseSdk.signInWithPopup(auth, new firebaseSdk.GoogleAuthProvider());
                    setAccountStatus('', false);
                } catch (error) {
                    console.error('Google sign-in failed.', error);
                    setAccountStatus(friendlyAuthError(error), true);
                }
            }
        });
        accountSignOut.addEventListener('click', async () => {
            try {
                await firebaseSdk.signOut(auth);
                setAccountStatus('Signed out. This device’s local practice is unchanged.', false);
            } catch (error) {
                console.error('Sign-out failed.', error);
                setAccountStatus('Sign-out failed. Try again.', true);
            }
        });
        firebaseSdk.onAuthStateChanged(auth, async user => {
            updateAccountUI(user);
            if (!user) return;
            setAccountStatus('Syncing your profile and practice…', false);
            try {
                await syncAccountData(user);
                setAccountStatus('Your profile and mock progress are synced.', false);
            } catch (error) {
                console.error('Initial cloud sync failed.', error);
                setAccountStatus('Cloud sync failed. Your local practice is still available; check your connection and Firebase setup.', true);
            }
        });
        window.addEventListener('ielts:profile-updated', queueSync);
        window.addEventListener('ielts:mock-progress-updated', queueSync);
        window.addEventListener('storage', event => {
            if (event.key === localKeys.profile || event.key === localKeys.progress || event.key === localKeys.activity) queueSync();
        });
    } catch (error) {
        console.error('Firebase account services could not be initialized.', error);
        accountSummary.textContent = error.message || 'Cloud account services are unavailable.';
        setAccountStatus('The app remains available locally. Configure the Firebase environment variables and deploy the API endpoints to enable accounts.', true);
        setAuthControlsDisabled(true);
    }
}

setAuthControlsDisabled(true);
window.ieltsAccountReady = initializeAccount();
