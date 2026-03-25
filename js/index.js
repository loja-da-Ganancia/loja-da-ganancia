
    document.addEventListener('DOMContentLoaded', () => {
        if (!isLoggedIn()) {
            document.getElementById('cardAtalhoDeck').style.display = 'none';
        }
    });
