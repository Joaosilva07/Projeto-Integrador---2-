package com.james.app.Controller

import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.GetMapping

@Controller
class HomeController {

    @GetMapping("/")
    String home() {
        return "redirect:/Loguin.html"
    }
}
