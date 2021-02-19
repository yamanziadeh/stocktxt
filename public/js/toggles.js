$(".switch").on("click", function () {
    if ($(this).hasClass("on")) {
        $(this).removeClass("on");
        $(this).addClass("off");
    } else if ($(this).hasClass("off")) {
        $(this).removeClass("off");
        $(this).addClass("on");
    }
})
