(() => {
  "use strict";

  const survey = document.getElementById("form-start");
  const form = document.getElementById("poll-form");
  const sections = [...form.querySelectorAll(".form-step")];
  const stages = [...document.querySelectorAll(".progress-step")];
  const counter = document.getElementById("step-count");
  const back = document.getElementById("prev");
  const next = document.getElementById("next");
  const finish = document.getElementById("send");
  const email = document.getElementById("q1_email");
  const consent = document.getElementById("consent");
  const thanks = document.getElementById("thank-you");

  let step = 0;

  function render() {
    sections.forEach((section, index) => { section.hidden = index !== step; });
    const activeStage = Number(sections[step].dataset.stage);
    stages.forEach((stage, index) => {
      stage.classList.toggle("done", index < activeStage);
      if (index === activeStage) stage.setAttribute("aria-current", "step");
      else stage.removeAttribute("aria-current");
    });
    counter.textContent = `Шаг ${step + 1} из ${sections.length}`;
    back.hidden = step === 0;
    next.hidden = step === sections.length - 1;
    finish.hidden = !next.hidden;
  }

  function focusSection(section) {
    section.querySelector("h2").focus({ preventScroll: true });
  }

  function go(to) {
    step = Math.max(0, Math.min(to, sections.length - 1));
    render();
    focusSection(sections[step]);
    survey.scrollIntoView({ block: "start" });
  }

  function setInvalid(control, invalid) {
    const message = document.getElementById(control.getAttribute("aria-describedby"));
    message.hidden = !invalid;
    if (invalid) control.setAttribute("aria-invalid", "true");
    else control.removeAttribute("aria-invalid");
  }

  function advance() {
    if (step === 0 && email.value.trim() && !email.validity.valid) {
      setInvalid(email, true);
      email.focus();
      return;
    }
    go(step + 1);
  }

  function updateConditional() {
    for (const group of form.querySelectorAll("[data-visible-when]")) {
      const [name, values] = group.dataset.visibleWhen.split(":");
      const selected = form.querySelector(`input[name="${CSS.escape(name)}"]:checked`);
      group.hidden = !selected || !values.split("|").includes(selected.value);
      if (group.hidden) group.querySelector("input").value = "";
    }
  }

  function enforceLimit(event) {
    const control = event.target;
    if (control.type !== "checkbox") return;
    const group = control.closest("[data-max]");
    const limit = Number(group?.dataset.max);
    if (!limit) return;
    const excess = group.querySelectorAll("input:checked").length > limit;
    if (excess) control.checked = false;
    group.querySelector(".limit-warning").hidden = !excess;
  }

  document.querySelector(".start-button").addEventListener("click", () => {
    focusSection(form.hidden ? thanks : sections[step]);
  });
  back.addEventListener("click", () => go(step - 1));
  next.addEventListener("click", advance);
  form.addEventListener("change", event => {
    if (event.target.type === "radio") updateConditional();
    enforceLimit(event);
  });
  email.addEventListener("input", () => {
    if (email.validity.valid) setInvalid(email, false);
  });
  consent.addEventListener("change", () => {
    if (consent.checked) setInvalid(consent, false);
  });

  form.addEventListener("submit", event => {
    event.preventDefault();
    if (step < sections.length - 1) {
      advance();
      return;
    }
    if (!consent.checked) {
      setInvalid(consent, true);
      consent.focus();
      return;
    }
    form.reset();
    form.hidden = true;
    document.querySelector(".survey-meta").hidden = true;
    thanks.hidden = false;
    focusSection(thanks);
    survey.scrollIntoView({ block: "start" });
  });

  render();
  updateConditional();
})();
