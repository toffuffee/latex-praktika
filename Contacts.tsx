import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import { Stack } from "@mui/material";
import { ContactsList } from "./contacts-list";
import { ContactDetails } from "./contact-details";
import { RootState, useDispatch, useSelector } from "@/redux/store";
import { useEffect } from "react";
import { fetchFolder } from "@/redux/slices/contacts";
import { toast } from "react-toastify";
import { useAuthContext } from "@/auth/useAuthContext";
import ProgressBar from "@/components/progress-bar";
import { setBrowserMode } from "@/redux/slices/mode";
import { useLocales } from "@/locales";

// ----------------------------------------------------------------------

export default function Contacts() {
  const { isLoading, error } = useSelector((state: RootState) => state.contacts);

  const { translate } = useLocales();

  const { user } = useAuthContext();

  const dispatch = useDispatch();

  const { contactId } = useParams();

  useEffect(() => {
    const mediaQuery = window.matchMedia("(display-mode: browser)");
    const handleChange = (event: any) => {
      if (event.matches) {
        dispatch(setBrowserMode("browser"));
        console.log("browser mode activated");
      } else {
        dispatch(setBrowserMode("pwa"));
        console.log("pwa mode activated");
      }
    };
    handleChange(mediaQuery);
    mediaQuery.addEventListener("change", handleChange);
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      dispatch(fetchFolder());
    }
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  return (
    <>
      <Helmet>
        <title> {`${translate("contacts")}`} </title>
      </Helmet>

      <Stack>
        {isLoading && <ProgressBar />}

        {contactId ? <ContactDetails /> : <ContactsList />}
      </Stack>
    </>
  );
}
