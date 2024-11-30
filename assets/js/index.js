import * as async from './modules/async.js';
import documentChecker from './modules/document-checker.js';

document.addEventListener('DOMContentLoaded', function () {
    // const topNavbar = async.get({
    //     url: '/includes/topnav.html',
    //     method: 'POST'
    // });

    // const sideNav = async.get({
    //     url: '/includes/sidenav.html',
    //     method: 'POST'
    // });

    // const footer = async.get({
    //     url: '/includes/footer.html',
    //     method: 'POST'
    // });

    const basePromiseList = {
        // 'top_navbar': topNavbar,
        // 'side_nav': sideNav,
        // 'footer': footer
    }

    async.waitForAll(basePromiseList).then((result) => {
        // document.getElementById('topnav').innerHTML = result['top_navbar'];
        // document.getElementById('sidenav').innerHTML = result['side_nav'];
        // document.getElementById('footer').innerHTML = result['footer'];

        checkActiveTab();

        const burgerIcon = document.getElementById('topnav-burger');
        burgerIcon.addEventListener('mousedown', function () { sidenavOpen(); });

        const notificationIcon = document.getElementById('topnav-notification');
        notificationIcon.addEventListener('mousedown', function () { notificationPopupOpen(); });

        documentChecker.setReady();
    });
});

function checkActiveTab() {
    const url = window.location.href;
    const sidenav = document.getElementById('sidenav');
    const anchorList = sidenav.querySelectorAll('.main-sidenav-menu a');
    anchorList.forEach(anchorElement => {
        if (anchorElement.href != url) return;
        anchorElement.classList.add('selected');
    });
}

function sidenavOpen() {
    const sidenav = document.getElementById('sidenav');
    if (!sidenav.classList.contains('show'))
        sidenav.classList.add('show');
    else
        sidenav.classList.remove('show');
}

function notificationPopupOpen() { }